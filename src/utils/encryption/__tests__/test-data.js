// Test data for comprehensive encryption testing
module.exports = {
  testData: {
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
          created: "2023-01-01T00:00:00Z",
          updated: "2023-12-31T23:59:59Z",
          version: 1.0
        }
      },
      arrays: {
        numbers: [1, 2, 3, 4, 5],
        strings: ["apple", "banana", "cherry"],
        mixed: [1, "two", true, null, { nested: "object" }],
        nested: [[1, 2], [3, 4], [5, 6]]
      },
      nullUndefined: {
        nullValue: null,
        undefinedValue: undefined,
        mixed: {
          hasNull: null,
          hasUndefined: undefined,
          normal: "value"
        }
      }
    },
    binary: {
      buffer: "SGVsbG8sIFdvcmxkIQ==",
      hex: "48656c6c6f2c20576f726c6421",
      base64: "SGVsbG8sIFdvcmxkIQ=="
    }
  },
  encryptionTests: {
    aes: {
      algorithm: "aes-256-gcm",
      secret: "test-secret-key-12345678901234567890123456789012",
      salt: "test-salt-1234567890123456789012345678901234567890123456789012345678901234",
      testCases: [
        {
          input: "Hello, World!",
          expectedEncrypted: {
            contains: ["encrypted", "iv", "salt", "tag"]
          },
          expectedDecrypted: "Hello, World!"
        },
        {
          input: { user: "john", id: 123, active: true },
          expectedEncrypted: {
            contains: ["encrypted", "iv", "salt", "tag"]
          },
          expectedDecrypted: '{"user":"john","id":123,"active":true}'
        },
        {
          input: "🔐🔑🛡️ Test with émojis and ñ special chars",
          expectedEncrypted: {
            contains: ["encrypted", "iv", "salt", "tag"]
          },
          expectedDecrypted: "🔐🔑🛡️ Test with émojis and ñ special chars"
        }
      ]
    },
    rsa: {
      keySize: 2048,
      testCases: [
        {
          input: "Hello, RSA!",
          expectedEncrypted: {
            isBase64: true,
            notEmpty: true
          },
          expectedDecrypted: "Hello, RSA!"
        },
        {
          input: "x".repeat(100),
          expectedEncrypted: {
            isBase64: true,
            notEmpty: true
          },
          expectedDecrypted: "x".repeat(100)
        }
      ]
    },
    e2ee: {
      curve: "prime256v1",
      testCases: [
        {
          input: "Secret E2EE message 🤫",
          expectedDecrypted: "Secret E2EE message 🤫"
        },
        {
          input: { action: "getData", params: { id: 123 } },
          expectedDecrypted: '{"action":"getData","params":{"id":123}}'
        }
      ]
    },
    hybrid: {
      testCases: [
        {
          input: "Small data",
          expectedDecrypted: "Small data"
        },
        {
          input: "x".repeat(3000),
          expectedDecrypted: "x".repeat(3000)
        }
      ]
    }
  },
  hashTests: {
    sha256: {
      input: "test data",
      expectedLength: 64,
      expectedFormat: "hex"
    },
    sha512: {
      input: "test data",
      expectedLength: 128,
      expectedFormat: "hex"
    },
    hmac: {
      input: "test data",
      secret: "hmac-secret",
      expectedLength: 64,
      expectedFormat: "hex"
    }
  },
  performanceTests: {
    encryption: {
      iterations: 1000,
      maxTimeMs: 5000,
      dataSizes: [
        { size: 100, maxTimeMs: 100 },
        { size: 1000, maxTimeMs: 500 },
        { size: 10000, maxTimeMs: 2000 }
      ]
    },
    decryption: {
      iterations: 1000,
      maxTimeMs: 5000
    },
    keyGeneration: {
      iterations: 100,
      maxTimeMs: 10000
    }
  },
  stressTests: {
    concurrent: {
      threads: 10,
      operationsPerThread: 100,
      maxTimeMs: 30000
    },
    memory: {
      maxMemoryMB: 100,
      operations: 10000
    },
    largeData: {
      sizes: ["1MB", "10MB", "100MB"],
      maxTimePerMB: 100
    }
  },
  securityTests: {
    invalidInputs: [null, undefined, "", 123, [], {}],
    malformedData: [
      "invalid-base64!",
      "not-hex-data",
      { malformed: "object" },
      "short",
      "x".repeat(1000000)
    ],
    bruteForce: {
      attempts: 10000,
      maxTimeMs: 60000
    }
  },
  edgeCases: {
    emptyData: "",
    nullData: null,
    undefinedData: undefined,
    veryLargeData: "x".repeat(1000000),
    specialCharacters: "\x00\x01\x02\x03\x04\x05",
    unicodeExtremes: "𝕌𝕟𝕚𝕔𝕠𝕕𝕖 𝕖𝕩𝕥𝕣𝕖𝕞𝕖 🚀🌟💫✨",
    nestedDepth: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: "deep"
            }
          }
        }
      }
    }
  }
};
