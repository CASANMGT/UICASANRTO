import re

with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'onclick="(setAdmFlt|admSrch|admDec|saveOv|saveCfg|resetCfg|selWAScen|saveWA|previewWA|resetWA|setPUF|admT|selPUOrder|confirmPickup|markHandoverDone)\(', r'onclick="window.rto.\1(', c)
c = re.sub(r'onchange="(updDimCfg|updThreshCfg)\(', r'onchange="window.rto.\1(', c)
c = re.sub(r'oninput="(admSrch)\(', r'oninput="window.rto.\1(', c)
# also clean up any duplicate window.rto.window.rto just in case
c = c.replace('window.rto.window.rto.', 'window.rto.')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('Fixed refs')
