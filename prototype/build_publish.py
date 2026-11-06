# Bundles the walkable game (play.html + all modules + three.js) into one self-contained page: publish/downstairs.html
# Usage: python3 build_publish.py <path-to-esbuild>
import re, subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__))
esb = sys.argv[1]
js = subprocess.run([esb, os.path.join(here, 'game/play.js'), '--bundle', '--format=esm', '--minify', '--target=es2020'], capture_output=True, text=True, check=True).stdout
js = js.replace('</script', '<\\/script')
html = open(os.path.join(here, 'play.html')).read()
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>|<meta name="viewport"[^>]*>', '', head)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
body = body.replace('<script type="module" src="./game/play.js"></script>', '<script type="module">\n' + js + '\n</script>')
out = head.strip() + '\n' + body.strip() + '\n'
os.makedirs(os.path.join(here, 'publish'), exist_ok=True)
open(os.path.join(here, 'publish/downstairs.html'), 'w').write(out)
print(len(out) // 1024, 'KB')
