-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS cv_builder_db;

USE cv_builder_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE, -- Added for user activation status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CV Templates table
CREATE TABLE IF NOT EXISTS cv_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_image_url VARCHAR(255)
);

-- CVs table
CREATE TABLE IF NOT EXISTS cvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT,
    cv_data JSON NOT NULL,
    name VARCHAR(255) DEFAULT 'Untitled CV',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES cv_templates(id) ON DELETE SET NULL
);

-- Seed some default CV templates (optional, but good for development)
INSERT INTO cv_templates (name, description, preview_image_url) VALUES
('Classic', 'A traditional and elegant CV template.', '/previews/classic.png'),
('Modern', 'A sleek and contemporary CV template.', '/previews/modern.png')
ON DUPLICATE KEY UPDATE name = name; -- Do nothing if they already exist
