import importlib.util
import pathlib
import unittest
spec=importlib.util.spec_from_file_location('agent',pathlib.Path(__file__).parents[1]/'public'/'hunter-agent.py')
agent=importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)
class Tests(unittest.TestCase):
    def setUp(self):
        self.data={'hashrate':{'total':[1234,None,None]},'results':{'shares_good':12,'shares_total':14},'uptime':120,'algo':'rx/0'}
    def test_real_metrics_unknown_sensors(self):
        p=agent.parse_summary(self.data,'a','Machine')
        self.assertEqual(p['hashrate'],1234)
        self.assertEqual(p['rejected'],2)
        self.assertIsNone(p['watts'])
        self.assertIsNone(p['temperature'])
    def test_algorithm_required(self):
        self.data.pop('algo')
        with self.assertRaises(ValueError): agent.parse_summary(self.data,'a','Machine')
    def test_missing_hashrate_is_not_fabricated_zero(self):
        self.data['hashrate']['total'][0]=None
        with self.assertRaises(ValueError): agent.parse_summary(self.data,'a','Machine')
    def test_share_count_validation(self):
        self.data['results']['shares_good']=20
        with self.assertRaises(ValueError): agent.parse_summary(self.data,'a','Machine')
    def test_nonfinite_and_boolean_rejected(self):
        for n in [float('nan'),float('inf'),True,-1]:
            with self.assertRaises(ValueError): agent.metric(n)
    def test_credentials_not_redirected(self):
        with self.assertRaises(RuntimeError): agent.NoRedirect().redirect_request(None,None,302,'',{},'https://other.example')
if __name__=='__main__': unittest.main()
