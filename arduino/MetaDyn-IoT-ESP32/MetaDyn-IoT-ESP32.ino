#include <Arduino.h>
#include <ESP_I2S.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE UUIDs must match the web app.
static const char *DEVICE_NAME = "MetaDynIoT_ESP32S3";
static const char *SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
static const char *CHAR_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";

// Audio settings must match the web app.
static const uint32_t SAMPLE_RATE = 16000;
static const uint8_t SAMPLE_BITS = 16;

// XIAO ESP32-S3 Sense PDM mic pins.
static const int MIC_CLK_PIN = 42;
static const int MIC_DATA_PIN = 41;

// Push-to-talk button (active LOW). Change to the GPIO you wire.
static const int PTT_PIN = 2;

// BLE notify payload (keep <= MTU - 3). 160 bytes == 80 samples ~5ms.
static const size_t AUDIO_CHUNK_BYTES = 160;

BLECharacteristic *audioCharacteristic = nullptr;
bool deviceConnected = false;
I2SClass i2s;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    deviceConnected = true;
  }
  void onDisconnect(BLEServer *server) override {
    deviceConnected = false;
    server->startAdvertising();
  }
};

void setupBle() {
  BLEDevice::init(DEVICE_NAME);
  BLEDevice::setMTU(185);

  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  audioCharacteristic = service->createCharacteristic(
      CHAR_UUID,
      BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);
  audioCharacteristic->addDescriptor(new BLE2902());

  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
}

void setupMic() {
  i2s.setPinsPdmRx(MIC_CLK_PIN, MIC_DATA_PIN);
  if (!i2s.begin(I2S_MODE_PDM_RX, SAMPLE_RATE, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO)) {
    Serial.println("Failed to initialize I2S PDM mic");
    while (true) {
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PTT_PIN, INPUT_PULLUP);

  setupMic();
  setupBle();

  Serial.println("MetaDyn IoT Bridge BLE mic ready");
}

void loop() {
  if (!deviceConnected || !audioCharacteristic) {
    delay(20);
    return;
  }

  // Active LOW push-to-talk.
  if (digitalRead(PTT_PIN) == LOW) {
    uint8_t buffer[AUDIO_CHUNK_BYTES];
    size_t bytesRead = i2s.readBytes(reinterpret_cast<char *>(buffer), AUDIO_CHUNK_BYTES);

    if (bytesRead > 0) {
      audioCharacteristic->setValue(buffer, bytesRead);
      audioCharacteristic->notify();
    }
  } else {
    delay(10);
  }
}
