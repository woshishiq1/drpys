#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BaseSpider 纯逻辑自检（零框架、零网络）：python spider/py/base/test_spider.py
覆盖：默认方法返回值、单例行为、buildUrl、fixAdM3u8 边界、RSA 往返、loadModule、封装方法齐全。
"""
import base64
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.dont_write_bytecode = True

from base.spider import Spider  # noqa: E402


class A(Spider):
    pass


class B(Spider):
    pass


a = A()

# 默认方法返回引擎期望的空结构，子类无需覆写即可加载
assert a.homeContent(True) == {'class': [], 'filters': {}}
assert a.categoryContent('1', 1, False, {}) == {'list': []}
assert a.searchContent('x', False) == {'list': []}
assert a.detailContent(['1']) == {}
assert a.homeVideoContent() == {}
assert a.playerContent('a', 'b') == {}
assert a.localProxy({})[0] == 404
assert a.isVideoFormat('x') is False and a.manualVideoCheck() is False
assert a.getName() == 'BaseSpider'

# 单例：同类复用、异类隔离、二次实例化不清缓存
a.setCache('k', 'v')
A()
assert a.getCache('k') == 'v', '二次实例化清空了缓存'
assert A() is a and B() is not a, '单例跨类串用'

# buildUrl：值含 '='（base64）不截断、无值参数不崩、无 query 直接拼
assert Spider.buildUrl('https://x.com/a?b=1&c', {'b': '2', 'd': 'ab=='}) == 'https://x.com/a?b=2&c=&d=ab=='
assert Spider.buildUrl('https://x.com/a', {'p': '1'}) == 'https://x.com/a?p=1'
assert Spider.buildUrl('https://x.com/a') == 'https://x.com/a'

assert Spider.bytesToHexString(b'\xab\x01') == 'AB01'
assert Spider.bytesToHexString(b'\xab\x01', no_space=False) == 'AB 01'
assert a.regStr('abc123def', r'c(\d+)d') == '123'
assert a.regStr('nomatch', r'x(\d+)') == ''
assert Spider.replaceAll('a.ts b.ts', r'(\w+)\.ts', r'\1.mp4') == 'a.mp4 b.mp4'

# fixAdM3u8：广告正则带/不带捕获组均可、直播无 ENDLIST、残缺尾不崩、无 EXTINF 原样返回
m3u8 = ("#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:4.0,\nhttps://cdn.com/v/ad01.ts\n"
        "#EXTINF:4.0,\nseg02.ts\n#EXTINF:4.0,\nseg03.ts\n#EXT-X-ENDLIST")
for ad in ('reg:ad[0-9]+[.]ts', 'reg:/v/(ad[0-9]+)[.]ts'):
    out = a.fixAdM3u8(m3u8, 'https://cdn.com/v/index.m3u8', ad)
    assert 'ad01' not in out and 'https://cdn.com/v/seg02.ts' in out and 'ENDLIST' in out, out
live = a.fixAdM3u8("#EXTM3U\n#EXTINF:4.0,\ns1.ts\n#EXTINF:4.0,\ns2.ts", 'https://c.com/l.m3u8', '')
assert 'https://c.com/s1.ts' in live and 's2.ts' in live, live
assert a.fixAdM3u8("#EXTM3U\n#EXTINF:4.0,", 'https://c.com/l.m3u8', '') == '#EXTM3U'
assert 'ENDLIST' in a.fixAdM3u8('#EXTM3U\n#EXT-X-ENDLIST', '', '')

# RSA 往返（短密文分支曾因 b''.join(bytes) 必崩；公钥加密曾用错编码名与密钥头）
from Crypto.PublicKey import RSA  # noqa: E402
from Crypto.Cipher import PKCS1_v1_5  # noqa: E402

key = RSA.generate(1024)
priv = '\n'.join(key.export_key().decode().splitlines()[1:-1])
pub = '\n'.join(key.publickey().export_key().decode().splitlines()[1:-1])
ct = base64.b64encode(PKCS1_v1_5.new(key.publickey()).encrypt(b'hello')).decode()
assert a.rsa_private_decode(ct, priv) == 'hello'
assert a.rsa_private_decode(a.rsa_public_encode('hello', pub), priv) == 'hello'

# loadModule（spec 方式）
p = os.path.join(tempfile.gettempdir(), '_spider_mod_test.py')
with open(p, 'w', encoding='utf-8') as f:
    f.write('VAL = 42\ndef f(): return VAL + 1\n')
try:
    assert a.loadModule('_spider_mod_test', p).f() == 43
finally:
    os.remove(p)

# 高级封装方法必须齐全（保留给源调用，不可删）
for name in ('fetch', 'post', 'postJson', 'postBinary', 'loadModule', 'utf8_array_to_str', 'skip_bytes',
             'eval_computer', 'safe_eval', 'check_unsafe_attributes', 'cleanText', 'custom_RegexGetText',
             'getProxyUrl', 'proxy_media_url', 'rewrite_m3u8_to_proxy', 'setCache', 'getCache', 'cleanup',
             'getDependence', 'setExtendInfo', 'init_api_ext_file', 'get_proxies', 'fixAdM3u8', 'replaceAll',
             'encodeStr', 'decodeStr', 'hexStringTobytes', 'coverDict2form', 'to_lower_camel_case',
             'gzinflate', 'gzipCompress', 'gzip', 'ungzip', 'bytes2stream', 'stream2bytes', 'remove_comments',
             'aes_cbc_decode', 'rsa_private_decode', 'rsa_public_encode', 'superStr2dict', 'isVideo',
             'adRemove', 'buildUrl', 'urljoin', 'md5', 'base64Encode', 'base64Decode', 'atob', 'btoa',
             'html', 'xpText', 'log', 'str2json', 'json2str'):
    assert hasattr(a, name), f'缺方法: {name}'

print('BaseSpider 自检全部通过')
