"""Reproducible, sequential NASA JPL Horizons downloads. No runtime API dependency."""
import json, urllib.parse, pathlib, datetime, time, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]/'public/data'
ROOT.mkdir(parents=True,exist_ok=True)
bodies={'voyager':-31,'mercury':199,'venus':299,'earth':399,'mars':499,'jupiter':599,'saturn':699,'uranus':799,'neptune':899}
windows=[('1977-09-06','2026-09-05','5 d'),('1977-09-06','1977-09-12','1 h'),('1979-03-01','1979-03-10','10 m'),('1980-11-08','1980-11-17','10 m')]
for name,code in bodies.items():
    dest=ROOT/(name+'.json')
    rows={}; sources=[]; header=''; requests=windows+[('2026-09-04','2026-09-05','1 d'),('2026-09-05','2100-01-01','5 d'),('2099-12-30','2100-01-01','1 d')]
    if dest.exists():
        old=json.loads(dest.read_text())
        if old['rows'][-1][0]>=2488069.5: continue
        rows={r[0]:r for r in old['rows']}; sources=old['queries']; header=old['header']; requests=[('2026-09-05','2100-01-01','5 d'),('2099-12-30','2100-01-01','1 d')]
    for start,stop,step in requests:
        params=dict(format='json',COMMAND=str(code),CENTER='500@10',EPHEM_TYPE='VECTORS',START_TIME=start,STOP_TIME=stop,STEP_SIZE=step,OUT_UNITS='KM-S',VEC_TABLE='2',CSV_FORMAT='YES',REF_PLANE='ECLIPTIC',REF_SYSTEM='ICRF',VEC_CORR='NONE',TIME_TYPE='TDB')
        url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode({k:(v if k=='format' else "'"+v+"'") for k,v in params.items()})
        for attempt in range(4):
            try:
                result=json.loads(subprocess.check_output(['curl','--fail','-Ls','--max-time','120',url])); raw=result['result']
                if '$$SOE' not in raw: raise ValueError(raw[-2000:])
                break
            except Exception:
                if attempt==3: raise
                time.sleep(2)
        if not header: header=raw.split('$$SOE')[0]
        for line in raw.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
            fields=line.split(','); jd=float(fields[0]); rows[jd]=[jd]+[float(n) for n in fields[2:8]]
        sources.append(url)
        print(name,start,step,len(rows),flush=True)
    dest.write_text(json.dumps(dict(name=name,code=code,source='NASA JPL Horizons',retrieved=datetime.datetime.now(datetime.timezone.utc).isoformat(),frame='Sun-centered J2000 ecliptic, geometric, TDB',units='km and km/s',queries=sources,header=header,rows=sorted(rows.values())),separators=(',',':')))
