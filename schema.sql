CREATE DATABASE IF NOT EXISTS ai_study_db;
USE ai_study_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  college_name VARCHAR(150) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  education_level VARCHAR(50) NOT NULL,
  avatar_url MEDIUMTEXT,
  study_goal VARCHAR(120),
  learning_style VARCHAR(80),
  daily_target VARCHAR(80),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INT PRIMARY KEY,
  overall_progress INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  topics_completed INT DEFAULT 0,
  questions_solved INT DEFAULT 0,
  last_active DATE DEFAULT (CURRENT_DATE),
  practice_state JSON,
  CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
