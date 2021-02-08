let deepEqual = require('deep-equal')

"use strict"

let str = "accessory 'TestFan' is removed.";

let namestr = str.match(/'(.+?)'/g)[0];
namestr = namestr.substr(1, namestr.length - 2);

let homebridge = {
  a: 12,
  f: (a, b) => {
    console.log(a + b);
  },
  c: 44
};

let homebridge2 = (a, b) => {
  let attr_a = a;
  let attr_b = b;
  return {
    t: (i, j) => {
      console.log(i + j);
    },
    g: () => {
      console.log(attr_a + attr_b);
    },
    set_a: (v) => {
      attr_a = v;
    },
    set_b: (v) => {
      attr_b = v;
    }
  };
};

let lololol = {};
lololol["x"] = 3;
lololol["y"] = 4;

let lololol1 = {};
lololol1["x"] = 3;
lololol1["y"] = 4;

let lololol2 = {};
lololol2["x"] = 4;
lololol2["y"] = 4;

// console.log(Object.keys(lololol).length);
// console.log(namestr);

console.log(deepEqual(lololol, lololol1));
console.log(deepEqual(lololol2, lololol1));

let hb = homebridge2(1, 2);

homebridge.f(homebridge.a, homebridge.c);

hb.g();
hb.t(5, 6);

hb.set_b(66);

hb.g();

let k = "default";

console.log(k["min"]);
