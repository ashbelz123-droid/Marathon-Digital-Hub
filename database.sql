-- ==========================
-- MARATHON DIGITAL HUB DB
-- PART 1
-- ==========================

CREATE DATABASE marathon_digital_hub;

USE marathon_digital_hub;

-- USERS TABLE

CREATE TABLE users (

id INT AUTO_INCREMENT PRIMARY KEY,

username VARCHAR(100) NOT NULL,

email VARCHAR(150) UNIQUE NOT NULL,

phone VARCHAR(30),

password VARCHAR(255) NOT NULL,

referral_code VARCHAR(50),

referred_by VARCHAR(50),

balance DECIMAL(15,2) DEFAULT 0,

status VARCHAR(20) DEFAULT 'active',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- MACHINES TABLE

CREATE TABLE machines (

id INT AUTO_INCREMENT PRIMARY KEY,

name VARCHAR(100) NOT NULL,

price DECIMAL(15,2) NOT NULL,

daily_income DECIMAL(15,2) NOT NULL,

duration_days INT NOT NULL,

image_url TEXT,

status VARCHAR(20) DEFAULT 'active',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- USER MACHINES

CREATE TABLE user_machines (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

machine_id INT NOT NULL,

purchase_amount DECIMAL(15,2),

daily_income DECIMAL(15,2),

start_date DATETIME,

end_date DATETIME,

status VARCHAR(20) DEFAULT 'running',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- DEPOSITS TABLE

CREATE TABLE deposits (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

amount DECIMAL(15,2) NOT NULL,

network VARCHAR(50),

transaction_id VARCHAR(150),

status VARCHAR(20) DEFAULT 'pending',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- WITHDRAWALS TABLE

CREATE TABLE withdrawals (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

amount DECIMAL(15,2) NOT NULL,

phone VARCHAR(30),

status VARCHAR(20) DEFAULT 'pending',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- TRANSACTIONS TABLE

CREATE TABLE transactions (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

type VARCHAR(50),

amount DECIMAL(15,2),

description TEXT,

status VARCHAR(20),

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- DAILY INCOME TABLE

CREATE TABLE incomes (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

machine_id INT NOT NULL,

amount DECIMAL(15,2),

income_date DATE,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- REFERRALS TABLE

CREATE TABLE referrals (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

referred_user_id INT NOT NULL,

bonus DECIMAL(15,2) DEFAULT 0,

level_no INT DEFAULT 1,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- NOTIFICATIONS TABLE

CREATE TABLE notifications (

id INT AUTO_INCREMENT PRIMARY KEY,

user_id INT NOT NULL,

title VARCHAR(255),

message TEXT,

status VARCHAR(20) DEFAULT 'unread',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ANNOUNCEMENTS TABLE

CREATE TABLE announcements (

id INT AUTO_INCREMENT PRIMARY KEY,

title VARCHAR(255),

content TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- ADMINS TABLE

CREATE TABLE admins (

id INT AUTO_INCREMENT PRIMARY KEY,

username VARCHAR(100),

email VARCHAR(150),

password VARCHAR(255),

role VARCHAR(50) DEFAULT 'admin',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- INDEXES

CREATE INDEX idx_user_id
ON deposits(user_id);

CREATE INDEX idx_withdraw_user
ON withdrawals(user_id);

CREATE INDEX idx_transaction_user
ON transactions(user_id);

CREATE INDEX idx_income_user
ON incomes(user_id);

-- SAMPLE MACHINES

INSERT INTO machines
(name, price, daily_income, duration_days, image_url)
VALUES

('RTX 3060 Mining Rig',
150000,
12000,
120,
'images/gpu1.jpg'),

('RTX 4070 Mining Rig',
350000,
28000,
120,
'images/gpu2.jpg'),

('ASIC Miner S19',
750000,
65000,
180,
'images/asic1.jpg'),

('ASIC Miner S21',
1200000,
110000,
180,
'images/asic2.jpg');
