import hashlib
import base58

def convert_armory_hex_to_wif(hex_key: str) -> str:
    # Step 1: Add 0x80 prefix for mainnet (for testnet, use 0xEF)
    extended_key = '80' + hex_key

    # Step 2: Double SHA-256 hash of the extended key
    first_hash = hashlib.sha256(bytes.fromhex(extended_key)).digest()
    second_hash = hashlib.sha256(first_hash).digest()

    # Step 3: Take the first 4 bytes of the second hash as the checksum
    checksum = second_hash[:4]

    # Step 4: Append the checksum to the extended key
    extended_key_with_checksum = bytes.fromhex(extended_key) + checksum

    # Step 5: Base58 encode the result to get the WIF key
    wif_key = base58.b58encode(extended_key_with_checksum).decode('utf-8')
    return wif_key

# Example usage:
armory_hex_key = "rjakwwkgauedduuhfrauofgrdghiswwfiuksfjrgituhfurhswrjfgihftothfirdjswngkf"  # Replace this with your actual Armory hex key
wif_key = convert_armory_hex_to_wif(armory_hex_key)
print("Your WIF key is:", wif_key)

