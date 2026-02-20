#!/bin/bash

# ==========================================
# Open Food Facts: Total Sugar Calculator
# ==========================================

# Accept a barcode as a command-line argument, or use a default
BARCODE=${1:-"7310401088125"} 

# Check for required tools
if ! command -v jq &> /dev/null || ! command -v awk &> /dev/null; then
    echo "Error: Both 'jq' and 'awk' are required for this script."
    exit 1
fi

echo "Fetching data for barcode: ${BARCODE}..."
echo "------------------------------------------------"

# Fetch data from Open Food Facts API
RESPONSE=$(curl -s -X GET "https://world.openfoodfacts.org/api/v2/product/${BARCODE}.json")

# Check if the product was found
STATUS=$(echo "${RESPONSE}" | jq -r '.status')
if [ "$STATUS" != "1" ]; then
    echo "Product not found in the Open Food Facts database."
    exit 1
fi

# Extract the display data
PRODUCT_NAME=$(echo "${RESPONSE}" | jq -r '.product.product_name // "Unknown Product"')
BRAND=$(echo "${RESPONSE}" | jq -r '.product.brands // "Unknown Brand"')
QUANTITY_STRING=$(echo "${RESPONSE}" | jq -r '.product.quantity // "Unknown Size"')

# Extract raw numeric values for math
PRODUCT_QUANTITY=$(echo "${RESPONSE}" | jq -r '.product.product_quantity // "N/A"')
SUGAR_100G=$(echo "${RESPONSE}" | jq -r '.product.nutriments.sugars_100g // "N/A"')

# Calculate total sugar using awk
if [[ "$SUGAR_100G" != "N/A" && "$PRODUCT_QUANTITY" != "N/A" && "$PRODUCT_QUANTITY" != "null" ]]; then
    # We use awk's printf to format it cleanly to 1 decimal place.
    # This also safely bypasses any Swedish locale comma vs. dot decimal issues in Bash.
    TOTAL_SUGAR=$(awk "BEGIN {printf \"%.1f\", ($PRODUCT_QUANTITY / 100) * $SUGAR_100G}")
else
    TOTAL_SUGAR="N/A (Missing quantity or sugar data)"
fi

# Print the final results
echo "Product:  ${PRODUCT_NAME}"
echo "Brand:    ${BRAND}"
echo "Size:     ${QUANTITY_STRING}"
echo "------------------------------------------------"
echo "Sugar per 100ml: ${SUGAR_100G} g"
echo "TOTAL SUGAR:     ${TOTAL_SUGAR} g"
echo "------------------------------------------------"
