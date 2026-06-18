/*
  Proyecto: Sistema Yoga de Corazón
  Archivo: schema_seed.sql

  PROPÓSITO:
  Este archivo es un modelo SQL referencial equivalente a la estructura usada en Firebase/Firestore.

  IMPORTANTE:
  - Este SQL NO está conectado al prototipo funcional.
  - La app real sigue usando Firebase Authentication y Firestore.
  - Se incluye solo para demostrar cómo se podría modelar la misma información en SQL.

  Equivalencias:
  Firestore users    -> SQL users
  Firestore packages -> SQL packages
  Firestore bookings -> SQL bookings
  Firestore classes  -> SQL classes
  Firestore expenses -> SQL expenses
*/

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS packages;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id VARCHAR(120) PRIMARY KEY,
  email VARCHAR(180) NOT NULL UNIQUE,
  display_name VARCHAR(180) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'student', 'instructor')),
  rut VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE packages (
  package_id VARCHAR(120) PRIMARY KEY,
  student_id VARCHAR(120) NOT NULL,
  student_name VARCHAR(180) NOT NULL,
  student_email VARCHAR(180) NOT NULL,
  type VARCHAR(40) NOT NULL CHECK (type IN ('10_classes', '20_classes', 'unlimited')),
  price_paid INTEGER NOT NULL,
  total_classes INTEGER NOT NULL,
  remaining_classes INTEGER NOT NULL,
  purchase_date TIMESTAMP,
  expiry_date TIMESTAMP,
  status VARCHAR(40) NOT NULL CHECK (status IN ('active', 'expiring', 'expired', 'dormant')),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE TABLE classes (
  class_id VARCHAR(120) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  instructor VARCHAR(180) NOT NULL,
  day_of_week VARCHAR(30),
  class_time VARCHAR(20),
  capacity INTEGER DEFAULT 10,
  description TEXT
);

CREATE TABLE bookings (
  booking_id VARCHAR(120) PRIMARY KEY,
  class_id VARCHAR(120) NOT NULL,
  class_name VARCHAR(180) NOT NULL,
  instructor VARCHAR(180),
  student_id VARCHAR(120) NOT NULL,
  student_name VARCHAR(180) NOT NULL,
  student_email VARCHAR(180) NOT NULL,
  class_date DATE NOT NULL,
  class_time VARCHAR(20),
  status VARCHAR(40) NOT NULL CHECK (status IN ('booked', 'attended', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE TABLE expenses (
  expense_id VARCHAR(120) PRIMARY KEY,
  amount INTEGER NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATOS DE PRUEBA REFERENCIALES
-- ============================================================

INSERT INTO users (user_id, email, display_name, role, rut, created_at) VALUES
('admin_val', 'valentina@gmail.com', 'Valentina (Propietaria)', 'admin', '22222222-2', '2026-06-17 00:00:00'),
('student_demo', 'joaquinvillanuevavarela@gmail.com', 'Joaquín Villanueva', 'student', '21286220-7', '2026-06-17 00:00:00'),
('xKVDecM4kSQPTdp18aBNDqHBOoX2', 'sofia@yoga.com', 'Sofía', 'instructor', '12345678-9', '2026-06-17 00:00:00'),
('EkKcaXZegVbxA0gCeCs6uk9kkax2', 'matias@yoga.com', 'Matías', 'instructor', '12345678-9', '2026-06-17 00:00:00'),
('uoENw7i17BQyW7xvOvrbNMka1v93', 'camila@yoga.com', 'Camila', 'instructor', '12345678-9', '2026-06-17 19:23:37'),
('Xl3BNePsYIWRuxs9JYnEF1AgAit2', 'lucas@yoga.com', 'Lucas', 'instructor', '12345678-9', '2026-06-17 19:25:15');

INSERT INTO classes (class_id, name, instructor, day_of_week, class_time, capacity, description) VALUES
('mon_1', 'Vinyasa Flow', 'Sofía', 'lunes', '07:00', 12, 'Clase de flujo dinámico para comenzar el día.'),
('mon_2', 'Hatha Tradicional', 'Matías', 'lunes', '09:00', 12, 'Clase enfocada en postura y respiración.'),
('thu_2', 'Ashtanga Pro', 'Camila', 'jueves', '09:00', 10, 'Clase de mayor intensidad.'),
('fri_4', 'Yin & Sonidos Sagrados', 'Lucas', 'viernes', '16:30', 15, 'Clase restaurativa.');

INSERT INTO packages (
  package_id,
  student_id,
  student_name,
  student_email,
  type,
  price_paid,
  total_classes,
  remaining_classes,
  purchase_date,
  expiry_date,
  status
) VALUES
(
  'pkg_joaquin_demo',
  'student_demo',
  'Joaquín Villanueva',
  'joaquinvillanuevavarela@gmail.com',
  '10_classes',
  50000,
  10,
  5,
  '2026-04-01 08:30:00',
  '2026-06-30 08:30:00',
  'active'
);

INSERT INTO bookings (
  booking_id,
  class_id,
  class_name,
  instructor,
  student_id,
  student_name,
  student_email,
  class_date,
  class_time,
  status,
  created_at
) VALUES
(
  'b_1',
  'mon_1',
  'Vinyasa Flow',
  'Sofía',
  'student_demo',
  'Joaquín Villanueva',
  'joaquinvillanuevavarela@gmail.com',
  '2026-06-15',
  '07:00',
  'attended',
  '2026-06-15 07:00:00'
),
(
  'b_2',
  'thu_2',
  'Ashtanga Pro',
  'Camila',
  'student_demo',
  'Joaquín Villanueva',
  'joaquinvillanuevavarela@gmail.com',
  '2026-06-20',
  '09:00',
  'booked',
  '2026-06-17 10:00:00'
);

INSERT INTO expenses (
  expense_id,
  amount,
  category,
  description,
  expense_date,
  created_at
) VALUES
('exp_1', 250000, 'sueldos', 'Pago de sueldo instructores de Yoga', '2026-05-28', '2026-05-28 00:00:00'),
('exp_2', 350000, 'arriendo', 'Arriendo mensual del salón principal', '2026-06-05', '2026-06-05 00:00:00'),
('exp_3', 52000, 'generales', 'Gastos de luz, agua y limpieza', '2026-06-10', '2026-06-10 00:00:00');

-- ============================================================
-- CONSULTAS DE EJEMPLO
-- ============================================================

-- Ver todos los usuarios:
-- SELECT * FROM users;

-- Ver alumnos con sus planes:
-- SELECT
--   u.display_name,
--   p.type,
--   p.remaining_classes,
--   p.status
-- FROM users u
-- JOIN packages p ON u.user_id = p.student_id
-- WHERE u.role = 'student';

-- Ver reservas:
-- SELECT
--   booking_id,
--   class_name,
--   instructor,
--   student_name,
--   class_date,
--   status
-- FROM bookings;
