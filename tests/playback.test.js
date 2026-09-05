import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartWindow,advancePlayback,liveJulianDate} from '../src/playback.js';
import {DAY} from '../src/ephemeris.js';

test('Chart marker moves from left to center without padded pre-departure samples',()=>{
 assert.deepEqual(chartWindow(0,0,100,6),{start:0,end:6,fraction:0});
 assert.deepEqual(chartWindow(1.5,0,100,6),{start:0,end:6,fraction:.25});
 assert.deepEqual(chartWindow(30,0,100,6),{start:27,end:33,fraction:.5});
});
test('Chart marker reaches the right edge and follows the live boundary',()=>{
 assert.deepEqual(chartWindow(98.5,0,100,6),{start:94,end:100,fraction:.75});
 assert.deepEqual(chartWindow(100,0,100,6),{start:94,end:100,fraction:1});
 assert.deepEqual(chartWindow(101,0,101,6),{start:95,end:101,fraction:1});
});
test('Accelerated playback catches live time and automatically changes to 1x',()=>{
 assert.deepEqual(advancePlayback(99,2,DAY,false,100),{date:100,rate:1,live:true});
 assert.deepEqual(advancePlayback(99,1,1,false,100),{date:99+1/DAY,rate:1,live:false});
});
test('Live follows the wall clock even after background throttling',()=>{
 assert.deepEqual(advancePlayback(100,0,1,true,100.5),{date:100.5,rate:1,live:true});
 const now=Date.parse('2030-01-01T00:00:00Z');
 assert.ok(liveJulianDate(now)>2462502.5);
 assert.ok(Math.abs((liveJulianDate(now+10000)-liveJulianDate(now))*DAY-10)<.0001);
});
