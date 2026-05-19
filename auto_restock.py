import mysql.connector
import requests
from datetime import datetime

SERMACROPS_BEARER_TOKEN = "test"

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',       
    'password': '',
    'database': 'brew_db' 
}
ENDPOINT_URL = "https://sermacrops-repo.onrender.com/api/edi/inbound"

def fetch_low_stock_items():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT item, current_stock, unit FROM inventory WHERE status = 'Low Stock' OR status = 'Critical'"
        cursor.execute(query)
        items = cursor.fetchall()
        
        cursor.close()
        conn.close()
        return items
    except Exception as e:
        print(f"Database error: {e}")
        return []

def generate_x12_850(items):
    if not items:
        return None

    now = datetime.now()
    date_6char = now.strftime("%y%m%d")      
    date_8char = now.strftime("%Y%m%d")      
    time_4char = now.strftime("%H%M")        

    control_num = "000000001" 
    po_number = f"PO{now.strftime('%M%S')}" 

    isa = f"ISA*00* *00* *ZZ*HONEYCOFFEE   *ZZ*SERMACROPS    *{date_6char}*{time_4char}*U*00401*{control_num}*0*P*>~\n"
    gs = f"GS*PO*HONEYCOFFEE*SERMACROPS*{date_8char}*{time_4char}*1*X*004010~\n"
    
    body_segments = [
        f"ST*850*0001",
        f"BEG*00*NE*{po_number}**{date_8char}",
        f"N1*BT*HONEY COFFEE SHOP*92*HQ001",
        f"N1*ST*HONEY COFFEE SHOP*92*STORE01",
        f"N3*Unit 3 Ground Floor Sunrise Commercial Building",
        f"N4*Calamba*Laguna*4027*PH",
        f"N1*SU*Sermacrops*92*SUP123",
        f"N3*456 Industrial Road Barangay San Isidro",
        f"N4*Batangas City*Batangas*4200*PH",
        f"PER*BD*Purchasing Department*TE*639000000000"
    ]

    for index, item in enumerate(items, start=1):
        item_code = item['item'].upper().replace(" ", "-") 
        qty = 100
        unit = "EA" 
        price = "5.00"
        
        po1_segment = f"PO1*{index}*{qty}*{unit}*{price}*PE*VN*{item_code}*UP*012345678905"
        body_segments.append(po1_segment)

    body_segments.append(f"CTT*{len(items)}")
    
    se_count = len(body_segments) + 1 
    body_segments.append(f"SE*{se_count}*0001")

    body_content = "~\n".join(body_segments) + "~\n"

    ge = f"GE*1*1~\n"
    iea = f"IEA*1*{control_num}~\n"

    full_x12 = f"{isa}{gs}{body_content}{ge}{iea}"
    return po_number, full_x12

def send_to_supplier(po_number, raw_edi):
    headers = {
        "Authorization": f"Bearer {SERMACROPS_BEARER_TOKEN}",
        "Content-Type": "application/EDI-X12"
    }
    
    try:
        print("Sending low stock transaction payload...")
        response = requests.post(ENDPOINT_URL, data=raw_edi, headers=headers, timeout=60)
        if response.status_code in [200, 201]:
            print(f"Success! Supplier accepted PO: {po_number}")
            return True
        print(f"Error transmission: Server answered with status code {response.status_code}")
    except Exception as e:
        print(f"Failed to communicate with API link: {e}")
    return False

if __name__ == "__main__":
    low_stock = fetch_low_stock_items()
    
    if low_stock:
        print(f"Detected {len(low_stock)} items running low in inventory.")
        po_id, x12_document = generate_x12_850(low_stock)
        
        print("\n--- GENERATED X12 850 DOCUMENT ---")
        print(x12_document)
        print("----------------------------------\n")
        
        send_to_supplier(po_id, x12_document)
    else:
        print("Inventory healthy. No low stock levels detected.")