import subprocess,pathlib
root=pathlib.Path(__file__).resolve().parents[1]/'public/textures'
root.mkdir(exist_ok=True,parents=True)
for name in ['mercury','venus_atmosphere','earth_daymap','mars','jupiter','saturn','uranus','neptune']:
    subprocess.run(['curl','--fail','-Ls','--max-time','60','https://www.solarsystemscope.com/textures/download/2k_'+name+'.jpg','-o',str(root/(name+'.jpg'))],check=True)
    print(name,flush=True)
