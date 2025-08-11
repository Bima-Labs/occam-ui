# 🧠 Blockchain Analytics Dashboard

A sleek, intuitive dashboard to monitor and analyze user and protocol-level data on a decentralized blockchain lending system.

## 🚀 Overview

This application allows users and admins to gain deep insight into blockchain-based lending activity. You can track global metrics such as:

- **TVL (Total Value Locked)**
- **Total USBD Minted**
- **Average Collateral Ratio (CR)**
- **Total Number of Users**

Additionally, you can enter any user address to get detailed analytics like:

- BTC collateral
- USBD minted
- Real-time CR
- Liquidation threshold
- Current health status


---

## 🖥️ Features

- 📊 Real-time display of protocol-wide metrics
- 🔍 Address-based user search for detailed financial data
- 📋 Dynamic table of user data with sortable columns
- 💡 Visual CR indicators with thresholds for liquidation
- 🌙 Clean, minimal design for high usability
- 🧩 Modular layout easy to extend for more assets/protocols

---
# Bima Blockchain Analytics

A Next.js-based analytics dashboard for blockchain options, supporting both EVM (Ethereum) and Bitcoin (UniSat) wallets.

---

## Features

- User options table with advanced filtering
- Signature verification for EVM and UniSat wallets
- REST API endpoints for user options management
- SSR/CSR compatible frontend

---

## Project Structure

```
src/
  components/
    tables/
      UserOptionsTable.tsx
  lib/
    signatureUtils.ts
  app/
    api/
      set-user-options/
        route.ts
  bitcoin.d.ts
```

---

## API Endpoints

### `POST /api/set-user-options`

**Description:**  
Add or update user options after verifying wallet signature.

**Request Body:**
```json
{
  "userAddress": "string",         // EVM address (0x...) or UniSat public key
  "callValue": "number",
  "putValue": "number",
  "signature": "string",           // Signature from wallet
  "signedMessageContent": "string" // Message that was signed
}
```

**Response:**
- `200 OK` with result from backend service
- `400 Bad Request` if required fields are missing
- `401 Unauthorized` if signature verification fails
- `500 Internal Server Error` for proxy errors

---

## Signature Verification

- **EVM wallets:** Uses `@metamask/eth-sig-util` to recover and verify address.
- **UniSat wallets:** Uses `bitcore-message` (with internal `bitcore-lib`) to verify Bitcoin signatures.  
  **Note:** For UniSat, you must provide the public key, not just the address.

---

## Setup & Development

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Run the development server:**
   ```
   npm run dev
   ```

3. **Build for production:**
   ```
   npm run build
   ```

---

## Notes

- Do **not** import `bitcore-lib` directly; only use `bitcore-message` for Bitcoin signature verification.
- If you use UniSat wallet, ensure the frontend sends both the address and public key to the backend.

---

## License

MIT



## API Documentation

### 1. `POST /api/set-user-options`

**Description:**  
Add or update user options for a blockchain address after verifying the wallet signature.

---

#### Request

**Endpoint:**  
`POST /api/set-user-options`

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**

| Name                 | Type     | Description                                                                                  |
|----------------------|----------|----------------------------------------------------------------------------------------------|
| userAddress          | string   | EVM address (starts with `0x`) or UniSat public key (for Bitcoin)                            |
| callValue            | number   | The call option value                                                                        |
| putValue             | number   | The put option value                                                                         |
| signature            | string   | Signature string from the wallet                                                             |
| signedMessageContent | string   | The message that was signed                                                                  |

**Example Request Body (EVM):**
```json
{
  "userAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "callValue": 100,
  "putValue": 50,
  "signature": "0xabcdef...",
  "signedMessageContent": "Sign this message to update your options"
}
```

**Example Request Body (UniSat/Bitcoin):**
```json
{
  "userAddress": "03a34f...publickey...", // UniSat public key
  "callValue": 100,
  "putValue": 50,
  "signature": "base64signature...",
  "signedMessageContent": "Sign this message to update your options"
}
```

---

#### Example cURL Commands

**EVM Wallet:**
```bash
curl -X POST http://localhost:3000/api/set-user-options \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "callValue": 100,
    "putValue": 50,
    "signature": "0xabcdef...",
    "signedMessageContent": "Sign this message to update your options"
  }'
```

**UniSat (Bitcoin) Wallet:**
```bash
curl -X POST http://localhost:3000/api/set-user-options \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "03a34f...publickey...",
    "callValue": 100,
    "putValue": 50,
    "signature": "base64signature...",
    "signedMessageContent": "Sign this message to update your options"
  }'
```

---

#### Responses

- **200 OK**
  ```json
  {
    "message": "User options updated successfully.",
    "data": { ... }
  }
  ```

- **400 Bad Request**
  ```json
  {
    "message": "Missing required fields for update or signature verification."
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "message": "Signature mismatch. Please ensure the message and signature are correct."
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "message": "Internal server error when saving options."
  }
  ```

---

#### Signature Verification Logic

- **EVM:**  
  The backend uses `@metamask/eth-sig-util` to recover the address from the signature and compares it to `userAddress`.

- **UniSat (Bitcoin):**  
  The backend uses `bitcore-message` to verify the signature.  
  **Important:** The frontend must send the public key (not just the address) for verification.

---

#### Security Notes

- Always sign a unique message on the frontend and send both the message and signature to the backend.
- Never send private keys or wallet

