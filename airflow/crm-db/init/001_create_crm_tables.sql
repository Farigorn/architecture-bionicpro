CREATE TABLE IF NOT EXISTS clients (
                                       id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS prosthetics (
                                           id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(64) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    installed_at TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
    );

INSERT INTO clients (id, full_name, email)
VALUES
    ('prothetic1', 'Иван Петров', 'prothetic1@example.com'),
    ('prothetic2', 'Мария Соколова', 'prothetic2@example.com')
    ON CONFLICT (id) DO NOTHING;

INSERT INTO prosthetics (id, client_id, model, serial_number, installed_at)
VALUES
    ('prosthetic-001', 'prothetic1', 'BionicPRO Hand v1', 'BP-HAND-001', CURRENT_TIMESTAMP),
    ('prosthetic-002', 'prothetic2', 'BionicPRO Hand v1', 'BP-HAND-002', CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;
