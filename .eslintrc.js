module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "$": "readonly",
        "iris": "readonly",
        "Gun": "readonly",
        "_": "readonly",
        "QRCode": "readonly",
        "ZXing": "readonly",
        "RindexedDB": "readonly",
        "Cropper": "readonly",
        "pica": "readonly",
        "EmojiButton": "readonly",
        "Autolinker": "readonly",
    },
    "parserOptions": {
        "ecmaVersion": 11,
        "sourceType": "module"
    },
    "rules": {
    }
};
