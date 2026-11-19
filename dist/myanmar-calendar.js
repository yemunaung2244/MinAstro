// Calendar conversion excerpt from yan9a/mmcal (ceMmDateTime.js).
/*
MIT License

Copyright (c) 2018 Yan Naing Aye

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
class ceMmDateTime {
  static GetMyConst(my) {
    var EI,
      WO,
      NM,
      EW = 0,
      i;
    var fme, wte;
    // The third era (the era after Independence 1312 ME and after)
    if (my >= 1312) {
      EI = 3;
      WO = -0.5;
      NM = 8;
      fme = [[1377, 1]];
      wte = [1344, 1345];
    }
    // The second era (the era under British colony: 1217 ME - 1311 ME)
    else if (my >= 1217) {
      EI = 2;
      WO = -1;
      NM = 4;
      fme = [
        [1234, 1],
        [1261, -1],
      ];
      wte = [1263, 1264];
    }
    // The first era (the era of Myanmar kings: ME1216 and before)
    // Thandeikta (ME 1100 - 1216)
    else if (my >= 1100) {
      EI = 1.3;
      WO = -0.85;
      NM = -1;
      fme = [
        [1120, 1],
        [1126, -1],
        [1150, 1],
        [1172, -1],
        [1207, 1],
      ];
      wte = [1201, 1202];
    }
    // Makaranta system 2 (ME 798 - 1099)
    else if (my >= 798) {
      EI = 1.2;
      WO = -1.1;
      NM = -1;
      fme = [
        [813, -1],
        [849, -1],
        [851, -1],
        [854, -1],
        [927, -1],
        [933, -1],
        [936, -1],
        [938, -1],
        [949, -1],
        [952, -1],
        [963, -1],
        [968, -1],
        [1039, -1],
      ];
      wte = [];
    }
    // Makaranta system 1 (ME 0 - 797)
    else {
      EI = 1.1;
      WO = -1.1;
      NM = -1;
      fme = [
        [205, 1],
        [246, 1],
        [471, 1],
        [572, -1],
        [651, 1],
        [653, 2],
        [656, 1],
        [672, 1],
        [729, 1],
        [767, -1],
      ];
      wte = [];
    }
    i = ceMmDateTime.bSearch2(my, fme);
    if (i >= 0) WO += fme[i][1]; // full moon day offset exceptions
    i = ceMmDateTime.bSearch1(my, wte);
    if (i >= 0) EW = 1; //correct watat exceptions

    return { EI: EI, WO: WO, NM: NM, EW: EW };
  }
  //----------------------------------------------------------------------------
  // Search first dimension in a 2D array
  // input: (k=key,A=array)
  // output: (i=index)
  static bSearch2(k, A) {
    var i = 0;
    var l = 0;
    var u = A.length - 1;
    while (u >= l) {
      i = Math.floor((l + u) / 2);
      if (A[i][0] > k) u = i - 1;
      else if (A[i][0] < k) l = i + 1;
      else return i;
    }
    return -1;
  }
  //-----------------------------------------------------------------------------
  // Search a 1D array
  // input: (k=key,A=array)
  // output: (i=index)
  static bSearch1(k, A) {
    var i = 0;
    var l = 0;
    var u = A.length - 1;
    while (u >= l) {
      i = Math.floor((l + u) / 2);
      if (A[i] > k) u = i - 1;
      else if (A[i] < k) l = i + 1;
      else return i;
    }
    return -1;
  }
  //-------------------------------------------------------------------------
  // Check watat (intercalary month)
  // input: (my = myanmar year)
  // output:  ( watat = intercalary month [1=watat, 0=common]
  //  fm = full moon day of 2nd Waso in jdn_mm (jdn+6.5 for MMT) [only valid when watat=1])
  // dependency: GetMyConst(my)
  static cal_watat(my) {
    //get data for respective era
    var SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
    var LM = 1577917828.0 / 53433336.0; //lunar month (29.53058795)
    var MO = 1954168.050623; //beginning of 0 ME for MMT
    var c = ceMmDateTime.GetMyConst(my); // get constants for the corresponding calendar era
    var TA = (SY / 12 - LM) * (12 - c.NM); //threshold to adjust
    var ed = (SY * (my + 3739)) % LM; // excess day
    if (ed < TA) ed += LM; //adjust excess days
    var fm = Math.round(SY * my + MO - ed + 4.5 * LM + c.WO); //full moon day of 2nd Waso
    var TW = 0,
      watat = 0; //find watat
    if (c.EI >= 2) {
      //if 2nd era or later find watat based on excess days
      TW = LM - (SY / 12 - LM) * c.NM;
      if (ed >= TW) watat = 1;
    } else {
      //if 1st era,find watat by 19 years metonic cycle
      //Myanmar year is divided by 19 and there is intercalary month
      //if the remainder is 2,5,7,10,13,15,18
      //https://github.com/kanasimi/CeJS/blob/master/data/date/calendar.js#L2330
      watat = (my * 7 + 2) % 19;
      if (watat < 0) watat += 19;
      watat = Math.floor(watat / 12);
    }
    watat ^= c.EW; //correct watat exceptions
    return { fm: fm, watat: watat };
  }
  //-------------------------------------------------------------------------
  // Check Myanmar Year
  // input: (my -myanmar year)
  // output:  (myt =year type [0=common, 1=little watat, 2=big watat],
  // tg1 = the 1st day of Tagu as jdn_mm (Julian Day Number for MMT)
  // fm = full moon day of [2nd] Waso as Julain Day Number
  // werr= watat discrepancy [0=ok, 1= error] )
  // dependency: cal_watat(my)
  static cal_my(my) {
    var yd = 0,
      y1,
      nd = 0,
      werr = 0,
      fm = 0;
    var y2 = ceMmDateTime.cal_watat(my);
    var myt = y2.watat;
    do {
      yd++;
      y1 = ceMmDateTime.cal_watat(my - yd);
    } while (y1.watat == 0 && yd < 3);
    if (myt) {
      nd = (y2.fm - y1.fm) % 354;
      myt = Math.floor(nd / 31) + 1;
      fm = y2.fm;
      if (nd != 30 && nd != 31) {
        werr = 1;
      }
    } else fm = y1.fm + 354 * yd;
    var tg1 = y1.fm + 354 * yd - 102;
    return { myt: myt, tg1: tg1, fm: fm, werr: werr };
  }
  //-------------------------------------------------------------------------
  // Julian day number to Myanmar date
  // input: (jdn -julian day number)
  // output:  (
  // myt =year type [0=common, 1=little watat, 2=big watat],
  // my = year,
  // mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
  //   Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
  //   Tabaung=12, Late Tagu=13, Late Kason=14 ],
  // md = day of the month [1 to 30])
  // dependency: cal_my(my)
  static j2m(jdn) {
    jdn = Math.round(jdn); //convert jdn to integer
    var SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
    var MO = 1954168.050623; //beginning of 0 ME
    var my, yo, dd, myl, mmt, a, b, c, e, f, mm, md;
    my = Math.floor((jdn - 0.5 - MO) / SY); //Myanmar year
    yo = ceMmDateTime.cal_my(my); //check year
    dd = jdn - yo.tg1 + 1; //day count
    b = Math.floor(yo.myt / 2);
    c = Math.floor(1 / (yo.myt + 1)); //big wa and common yr
    myl = 354 + (1 - c) * 30 + b; //year length
    mmt = Math.floor((dd - 1) / myl); //month type: late =1 or early = 0
    dd -= mmt * myl;
    a = Math.floor((dd + 423) / 512); //adjust day count and threshold
    mm = Math.floor((dd - b * a + c * a * 30 + 29.26) / 29.544); //month
    e = Math.floor((mm + 12) / 16);
    f = Math.floor((mm + 11) / 16);
    md = dd - Math.floor(29.544 * mm - 29.26) - b * e + c * f * 30; //day
    mm += f * 3 - e * 4 + 12 * mmt; // adjust month numbers for late months
    return { myt: yo.myt, my: my, mm: mm, md: md };
  }
}

export function myanmarMonth(date) {
  return ceMmDateTime.j2m(Date.parse(date + "T12:00:00Z") / 86400000 + 2440587.5);
}
