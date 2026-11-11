"""Bundle the static app for direct file:// use without a web server."""
from pathlib import Path
import base64
import re
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'styles.css').read_text()
pricing = (root / 'pricing.js').read_text().replace('export ', '')
app = (root / 'app.js').read_text().replace("import { calculate, convert } from './pricing.js';", '')
html = re.sub(r'<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">', lambda _: '<style>' + css + '</style>', html)
html = re.sub(r'<script type="module" src="app\.js(?:\?[^"]*)?"></script>', lambda _: '<script>\n' + pricing + '\n' + app + '\n</script>', html)
for asset in (root / 'assets').glob('*.png'):
    data = base64.b64encode(asset.read_bytes()).decode()
    html = html.replace('assets/' + asset.name, 'data:image/png;base64,' + data)
(root / 'EG-Quote-Builder.html').write_text(html)
print('Built EG-Quote-Builder.html')
