
/**
 * Note: Web Bluetooth requires a secure context (HTTPS) and user interaction.
 * XIAO ESP32 S3 Sense must be running a BLE Peripheral server
 * advertising the service and characteristic defined below.
 */

// Fix: Defined Web Bluetooth interfaces as they are not present in the default TypeScript environment.
interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService extends EventTarget {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface Bluetooth extends EventTarget {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

interface RequestDeviceOptions {
  filters?: { name?: string; namePrefix?: string; services?: (string | number)[] }[];
  optionalServices?: (string | number)[];
}

// Fix: Augmented the global Navigator interface to include the bluetooth property.
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}

const AUDIO_SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const AUDIO_CHAR_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  async connect(): Promise<string> {
    // Fix: Using the augmented navigator.bluetooth to check for support.
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    // Fix: Accessing requestDevice through the typed bluetooth property.
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'XIAO' }],
      optionalServices: [AUDIO_SERVICE_UUID]
    });

    if (!this.device) throw new Error('Device not selected');

    this.server = await this.device.gatt?.connect() || null;
    if (!this.server) throw new Error('Failed to connect to GATT server');

    const service = await this.server.getPrimaryService(AUDIO_SERVICE_UUID);
    this.characteristic = await service.getCharacteristic(AUDIO_CHAR_UUID);

    return this.device.name || 'XIAO ESP32';
  }

  async startNotifications(callback: (data: DataView) => void) {
    if (!this.characteristic) return;
    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
      // Fix: Casting event.target to BluetoothRemoteGATTCharacteristic to resolve type error on line 41.
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (target.value) {
        callback(target.value);
      }
    });
  }

  async disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }
}

export const bluetoothService = new BluetoothService();
