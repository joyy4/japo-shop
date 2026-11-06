<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "japos_shop";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Database Connection Failed"]));
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. Ambil Semua Produk
if ($action === 'get_products') {
    $result = $conn->query("SELECT * FROM products ORDER BY id ASC");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row['price'] = (int)$row['price'];
        $row['rating'] = (float)$row['rating'];
        $products[] = $row;
    }
    echo json_encode($products);
    exit;
}

// 2. Buat Pesanan Baru
if ($action === 'create_order') {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data) {
        $order_id = "JAPOS-SHOP-" . rand(100000, 999999);
        $name = $conn->real_escape_string($data['name']);
        $phone = $conn->real_escape_string($data['phone']);
        $address = $conn->real_escape_string($data['address']);
        $payment = $conn->real_escape_string($data['payment']);
        $items = json_encode($data['items']);
        $total = (int)$data['total'];
        
        $sql = "INSERT INTO orders (order_id, customer_name, phone, address, payment_method, items, total_price, status) 
                VALUES ('$order_id', '$name', '$phone', '$address', '$payment', '$items', $total, 'Di Proses')";
        
        if ($conn->query($sql)) {
            echo json_encode([
                "status" => "success",
                "order" => [
                    "id" => $order_id,
                    "customer_name" => $name,
                    "phone" => $phone,
                    "address" => $address,
                    "payment_method" => $payment,
                    "items" => $data['items'],
                    "total_price" => $total,
                    "status" => "Di Proses",
                    "created_at" => date("Y-m-d H:i:s")
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    }
    exit;
}

// 3. Update Status Pesanan
if ($action === 'update_order_status') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['order_id']) && isset($data['status'])) {
        $order_id = $conn->real_escape_string($data['order_id']);
        $status = $conn->real_escape_string($data['status']);
        
        $sql = "UPDATE orders SET status = '$status' WHERE order_id = '$order_id'";
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    }
    exit;
}

$conn->close();
?>