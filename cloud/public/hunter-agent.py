#!/usr/bin/env python3
"""Read-only XMRig telemetry bridge. No mining control, wallet keys, or purchasing.
Python 3.10+. HUNTER_SITE_TOKEN is a Sites service-access credential; treat it as a secret.
Optional XMRIG_API_TOKEN authenticates the local read-only API. Missing sensors stay null.
"""
import argparse
import hashlib
import json
import math
import os
import socket
import time
import urllib.request
import urllib.parse

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Redirect refused to protect credentials')

def metric(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError('Missing or invalid metric')
    return value

def parse_summary(data, device_id, name):
    total = data.get('hashrate', {}).get('total', [])
    rate = metric(total[0]) if total else metric(None)
    results = data.get('results', {})
    good, shares = metric(results.get('shares_good')), metric(results.get('shares_total'))
    if good > shares:
        raise ValueError('Inconsistent share counts')
    algorithm = data.get('algo')
    if not isinstance(algorithm, str) or not algorithm:
        raise ValueError('Missing algorithm; refusing to assume RandomX')
    return {'id': device_id, 'name': name, 'hashrate': rate, 'algorithm': algorithm,
            'uptime': metric(data.get('uptime')), 'accepted': good, 'rejected': shares-good,
            'watts': None, 'temperature': None}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', required=True, help='Your owner-private HTTPS dashboard origin')
    parser.add_argument('--name', default=socket.gethostname())
    parser.add_argument('--port', type=int, default=18088, help='Loopback XMRig HTTP API port')
    parser.add_argument('--once', action='store_true')
    args = parser.parse_args()
    url = urllib.parse.urlparse(args.site)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.path not in ('','/') or url.query or url.fragment:
        parser.error('--site must be an HTTPS origin, with no path, credentials, query, or fragment')
    if not 1 <= args.port <= 65535 or not 1 <= len(args.name) <= 80:
        parser.error('Invalid port or machine name')
    token = os.environ.get('HUNTER_SITE_TOKEN', '')
    if not token:
        parser.error('Set HUNTER_SITE_TOKEN to the owner-issued Sites service-access credential')
    api_token = os.environ.get('XMRIG_API_TOKEN', '')
    opener = urllib.request.build_opener(NoRedirect(), urllib.request.ProxyHandler({}))
    device_id = hashlib.sha256((socket.gethostname() + ':' + str(args.port)).encode()).hexdigest()[:24]
    while True:
        try:
            headers = {'Accept': 'application/json'}
            if api_token:
                headers['Authorization'] = 'Bearer ' + api_token
            with opener.open(urllib.request.Request(f'http://127.0.0.1:{args.port}/2/summary', headers=headers), timeout=5) as response:
                data = json.loads(response.read(1024*1024))
            payload = parse_summary(data, device_id, args.name)
            request = urllib.request.Request(args.site.rstrip('/')+'/api/telemetry', data=json.dumps(payload,allow_nan=False).encode(), headers={'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+token}, method='POST')
            with opener.open(request, timeout=10) as response:
                result = json.loads(response.read(16384))
                if not result.get('ok'):
                    raise RuntimeError('Upload was not acknowledged')
            print(time.strftime('%H:%M:%S'), 'Telemetry delivered.', flush=True)
        except Exception as exc:
            # Do not print response bodies, URLs, request headers, tokens, or local miner config.
            print(time.strftime('%H:%M:%S'), 'Telemetry unavailable:', type(exc).__name__, flush=True)
            if args.once:
                raise SystemExit(1)
        if args.once:
            break
        time.sleep(30)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Telemetry stopped. Miner state is unchanged.')
