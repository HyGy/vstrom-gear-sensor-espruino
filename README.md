# vstrom-gear-sensor-espruino
suzuki vstrom gear sensor with wemos d1 mini (esp8266)

needed hardware:

- wemos mini d1 (esp8266)
- ads1115
- dc/dc converter 12->5V
- DS18B20 Temperature Sensor Module Kit Waterproof
- 0.96" oled i2c display


download espruino from espruino.com for esp8266 (the version what includes the graphics library)

Not yet tested on real vstrom, but it need to work. Maybe need to modify the values in processGearVoltage() function.

The code may be messy...
