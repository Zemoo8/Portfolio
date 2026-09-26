# Returns the first time (s) where Unity's red "GAME OVER" title is visible, else the duration.
import subprocess, sys, io
from PIL import Image
f = sys.argv[1]
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
t = 0.0
while t < dur:
    png = subprocess.run(['ffmpeg','-loglevel','error','-ss',f'{t:.2f}','-i',f,'-frames:v','1','-vf','scale=400:-1','-f','image2pipe','-vcodec','png','-'],capture_output=True).stdout
    im = Image.open(io.BytesIO(png)).convert('RGB'); w,h = im.size
    red = sum(1 for x in range(int(w*.3),int(w*.7)) for y in range(int(h*.25),int(h*.45)) if (lambda p: p[0]>200 and p[1]<90 and p[2]<90)(im.getpixel((x,y))))
    if red > 40: print(f'{t:.2f}'); sys.exit()
    t += 0.25
print(f'{dur:.2f}')
