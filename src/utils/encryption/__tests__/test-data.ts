// Test data for comprehensive encryption testing
export interface TestData {
  testData: any;
  encryptionTests: any;
  edgeCases: any;
  strings: {
    simple: string;
    unicode: string;
    empty: string;
    spaces: string;
    specialChars: string;
    numbers: string;
    alphanumeric: string;
    long: string;
    jsonString: string;
  };
  numbers: {
    integer: number;
    negative: number;
    zero: number;
    float: number;
    large: number;
    scientific: number;
  };
  booleans: {
    true: boolean;
    false: boolean;
  };
  objects: {
    simple: {
      user: string;
      id: number;
      active: boolean;
    };
    nested: {
      user: {
        profile: {
          name: string;
          age: number;
          address: {
            street: string;
            city: string;
            country: string;
          };
        };
        preferences: {
          theme: string;
          notifications: boolean;
          language: string;
        };
      };
      metadata: {
        created: string;
        updated: string;
        version: number;
        tags: string[];
      };
    };
    array: {
      numbers: number[];
      strings: string[];
      mixed: (string | number | boolean)[];
      nested: {
        id: number;
        name: string;
        active: boolean;
      }[];
    };
  };
  nullUndefined: {
    nullValue: null;
    undefinedValue: undefined;
  };
  binary: {
    buffer: Buffer;
    uint8Array: Uint8Array;
    dataView: DataView;
  };
}

export const testData: TestData = {
  strings: {
    simple: "Hello, World!",
    unicode: "🔐🔑🛡️ Test with émojis and ñ special chars",
    empty: "",
    spaces: "   ",
    specialChars: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
    numbers: "1234567890",
    alphanumeric: "abc123XYZ",
    long: "x".repeat(10000),
    jsonString: '{"name":"John","age":30,"city":"New York"}'
  },
  numbers: {
    integer: 42,
    negative: -123,
    zero: 0,
    float: 3.14159,
    large: 9007199254740991,
    scientific: 1.23e-4
  },
  booleans: {
    true: true,
    false: false
  },
  objects: {
    simple: {
      user: "john",
      id: 123,
      active: true
    },
    nested: {
      user: {
        profile: {
          name: "John Doe",
          age: 30,
          address: {
            street: "123 Main St",
            city: "New York",
            country: "USA"
          }
        },
        preferences: {
          theme: "dark",
          notifications: true,
          language: "en"
        }
      },
      metadata: {
        created: "2023-01-01T00:00:00.000Z",
        updated: "2023-12-31T23:59:59.999Z",
        version: 1.0,
        tags: ["production", "api", "v1"]
      }
    },
    array: {
      numbers: [1, 2, 3, 4, 5],
      strings: ["apple", "banana", "cherry"],
      mixed: ["text", 123, true, null],
      nested: [
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false },
        { id: 3, name: "Charlie", active: true }
      ]
    }
  },
  nullUndefined: {
    nullValue: null as null,
    undefinedValue: undefined as undefined
  },
  binary: {
    buffer: Buffer.from("binary data test"),
    uint8Array: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    dataView: new DataView(new ArrayBuffer(16))
  }
};

export default testData;
