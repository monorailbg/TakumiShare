import base64

with open('website.zip', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()

html_top = '''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Unentdecktes Tokio – Website Download</title>
<style>
  body { font-family: sans-serif; background: #1A1A2E; color: #F5E6D3; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(192,57,43,0.4); max-width: 480px; }
  h1 { color: #C0392B; margin-bottom: 8px; }
  p { color: #C8A882; line-height: 1.6; }
  .dl-btn { display: inline-block; margin-top: 20px; padding: 14px 28px; background: #C0392B; color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold; cursor: pointer; }
  .dl-btn:hover { background: #A93226; }
</style>
</head>
<body>
<div class="box">
  <h1>Unentdecktes Tokio</h1>
  <p>Deine Website-Dateien werden automatisch heruntergeladen.<br>Falls nicht, klicke den Button.</p>
  <a class="dl-btn" id="dlbtn" href="#" download="unentdecktes-tokio.zip">Download starten</a>
  <p style="font-size:0.8em;margin-top:20px;color:#8D6E63;">Entpacke die ZIP-Datei und öffne <strong>index.html</strong> im Browser.</p>
</div>
<script>
var b64 = "'''

html_bottom = '''";
var bin = atob(b64);
var arr = new Uint8Array(bin.length);
for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
var blob = new Blob([arr],{type:"application/zip"});
var url = URL.createObjectURL(blob);
document.getElementById("dlbtn").href = url;
(function(){
  var a = document.createElement("a");
  a.href = url;
  a.download = "unentdecktes-tokio.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
})();
</script>
</body>
</html>'''

with open('get-website.html', 'w') as f:
    f.write(html_top + b64 + html_bottom)

print('Done. Size:', len(html_top) + len(b64) + len(html_bottom), 'bytes')
