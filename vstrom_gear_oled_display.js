// http://www.espruino.com/Image+Converter
var img = {
  width : 128, height : 64, bpp : 1,
  transparent : 0,
  buffer : E.toArrayBuffer(atob("AAAAGAAAAAAPiB7xwAAAAAAAAPwAAAAACMgwgiAAAAAAAAH4AAAAAAhIIPIgAAAAAAAD8MAAAAAISDwKIAAAAAAAA/DAAAAACEgiCiAAAAAAAAfh4AAAAAjIIgogAAAAAAAH4eAAAAAPj5zxwAAAAAAAD8PgAAAAAAAAAAAAAAAAAB/D4AAAAAAAAAAAAAAAAAB/h+AAAAAAAAAAAAAAAAf//4fwAAAAAAAAAAAAAAAf//8P8AAAAAAAAAAAAAAAP///D/AAAAAAAAAAAAAAAD///g/4ACAAB5xzh5zzznB///4f/AA8AAiiCgQiihFAf//8H//wfgAIvnoDvonRQH///D//4H+ACKCKAKCIUUB///w//+D/wAee+geei85Af//4f//A/8AAgAAAAAAAAH//+H//wf/gBwAAAAAAAAA///B//4H/4AAAAAAAAAAAH//w//+D/+AICBAUASEAAAf/4P//A//gAAAAEAIiAAAD/+D//wf/4AAAABAAIAAAAf/B//4H/+ALydOV5yc8AAD/wf/+B//gCioQVCCgoAAA/4H//A//wAoqE9RHp5wAAP+B//wP/8AKKhRUiKiEAAB/gf/4D/+ACinX1e+vvSQAfwH/8B/+AAAAAAAAAAAAAP8A//Af/AAAAAAAAAAAAAD+AH/AH/AAAAAAAAAAAAAB/gAAAD/gAAAAAAAAAAAAA/4AAAA/gAAAAAAAAAAAAAf8AAAAPwAAAAAAAAAAAAAP/AAAAD4AAAAAAAAAAAAAH/gAAAA8AAAAAAAAAAAAAB/4AAAAPAAAAAAAAAAAAAA/+AH+AHwAAAAAAAAAAAAAf/AH/4B+AAAAAAAAAAAAAH/wD//AfgAAAAAAAAAAAAB/4B//wH8AAAAAAAAAAAAA/+A//+B/gAAAAAAAAAAAAP/gP//gf+AAAAAAAAAAAAD/wH//8H/wAAhAHgAAAAAA/8D///B//AAIQDEAAAAAAP/A///wf/4ACEigIgAAAAD/gf//8D/+AA/IpyIAAAAA/4H/B/g//wAIRSEUAAAAAP+D/gH4P/8ACEUxFAAAAAD/A/wA+D//AAhCHggAAAAA/wP8AHg//wAAAgAIAAAAAH8H+AA8H/8AAAwAMAAAAAB+B/gAHB//AAAAAAAAAAAAPgf4ABwf/gAAAAAAAAAAAB4H8AAOH/4ABxzj4OOBxwAOB/AABg/+AAiiICEUQiiABA/wAAIP/gAAoiBBEEAogAAP4AABD/wAASIgQRCARwAAD8AAAAf8AAIiIIERAIiAAA+AAAAH+AAEIiCBEgEIgAAGAAAAB/AAD5z5COfT5yAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="))
};


var wifi = require("Wifi");
var ssd1306 = require("SSD1306");
var ow = new OneWire(NodeMCU.D4);
var sensor = require("DS18B20").connect(ow);

I2C1.setup({scl:NodeMCU.D1,sda:NodeMCU.D2});

var ads = require("ADS1X15").connect(I2C1);
ads.setGain(2048); // +/- 2.048mV


require("Font8x16").add(Graphics);

var lcd;
var showSplashScreen=null;

var currentTemp = null;
var currGear = "-";
var currGearVoltage = null;
var currBatteryVoltage = 0;
var measuringInprogress = false;
var actualReading = 'gear'; // battery, gear


var drawScreen = function() {
  if (showSplashScreen) return;

  lcd.setFontVector(63);
  lcd.clear();
  lcd.drawString(currGear, 0,0);
  lcd.setFontVector(18);
  lcd.drawString(currBatteryVoltage+" V",60,0);
  lcd.drawString(currentTemp+" C",60,25);
// lcd.setFont8x16();
// lcd.drawString("zizi",50,40);
  lcd.flip();
};





  /*
  1.39 -> 1
  1.81 -> 2
  2.55 -> 3
  3.25 -> 4
  4.10 -> 5
  4.55 -> 6
  5V -> N
  */

var processGearVoltage = function(voltage)
{
  //  currentVoltage = Math.round(voltage * 10) / 10;
  // 39k / 22k
  // 5.5V (max) -> 1.984V
  // 5.5/1.984*mert ertek

  measuringInprogress=false;
  actualReading='battery';

  var cV=2.772177*voltage;
  //console.log('gear:'+cV);
  currGearVoltage=cV;
  if (cV>0 && cV<=1.6) { currGear="1"; }
  else
    if (cV>1.6 && cV<=2.2) { currGear="2"; }
    else
      if (cV>2.2 && cV<=3) { currGear="3"; }
      else
        if (cV>3 && cV<=3.75) { currGear="4"; }
        else
          if (cV>3.75 && cV<4.25) { currGear="5"; }
          else
            if (cV>4.25 && cV<4.8) { currGear="6"; }
            else
              if (cV>4.8) { currGear="N"; }
  drawScreen();

};

var processBatteryVoltage = function(voltage)
{
  measuringInprogress=false;
  actualReading='gear';

//  currentVoltage = Math.round(voltage * 10) / 10;
  // 39k / 22k
  // 5.5V (max) -> 1.984V
  // 5.5/1.984*mert ertek

  currBatteryVoltage=7.667*voltage;

//  console.log('battery:'+currBatteryVoltage);

  currBatteryVoltage = Math.round(currBatteryVoltage *100) /100;

  drawScreen();
};

var readGearVoltage = function()
{
  if (measuringInprogress) return;
  measuringInprogress=true;
  ads.getADCVoltage(0, processGearVoltage );
};

var readBatteryVoltage = function()
{
  if (measuringInprogress) return;
  measuringInprogress=true;
  ads.getADCVoltage(1, processBatteryVoltage );
};

var ADSReader = function() {
//  console.log(actualReading);
  if (actualReading=='gear')
  {
    readGearVoltage();
    return;
  }

  if (actualReading=='battery');
  {
    readBatteryVoltage();
    return;
  }
};

var processTemp = function(temp) {
  currentTemp = Math.round(temp * 10) / 10;
  drawScreen();
};

var tempReader = function() {
  sensor.getTemp(processTemp);
};


var startTheTimers = function() {
  lcd.clear();
  lcd.flip();
  lcd.setFont8x16();

  splashScreen();
  setTimeout( hideSplashScreen, 1500);

  console.log('starting voltage readers');
  setInterval(ADSReader, 100);
  console.log('starting temp reader');
  setInterval(tempReader, 1000);

};

var splashScreen = function()
{
  lcd.drawImage(img, 0, 0);
  lcd.flip();
  showSplashScreen=true;
};

var hideSplashScreen = function()
{
  showSplashScreen=false;
};

var init = function() {
  console.log("Initializing");
  lcd = ssd1306.connect(I2C1, startTheTimers);
};

E.on('init', function() {  init(); } );


init();
