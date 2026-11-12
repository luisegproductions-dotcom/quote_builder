"""Bundle the vendored JWT verifier and service into one Apps Script paste."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
folder = root / 'google-apps-script'
(folder / 'Install.gs').write_text((folder / 'JwtLibrary.gs').read_text() + '\n' + (folder / 'Code.gs').read_text())
print('Built google-apps-script/Install.gs')
