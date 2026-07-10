-- StudyHub seed data
-- Run after schema.sql. Safe to re-run: inserts are idempotent.

insert into public.categories (name, slug, description) values
  ('Handwritten Notes', 'handwritten-notes', 'Scanned or photographed handwritten class notes'),
  ('Classroom Notes', 'classroom-notes', 'Typed notes taken during lectures'),
  ('Question Papers', 'question-papers', 'Previous year and model question papers'),
  ('Assignments', 'assignments', 'Solved assignments and homework'),
  ('Practical Files', 'practical-files', 'Lab records and practical work files'),
  ('Mini Projects', 'mini-projects', 'Small course projects with reports'),
  ('Major Projects', 'major-projects', 'Final year and capstone projects'),
  ('Presentations', 'presentations', 'Seminar and topic presentations'),
  ('Study Material', 'study-material', 'Curated study guides and summaries'),
  ('Lab Manuals', 'lab-manuals', 'Laboratory manuals and procedures')
on conflict (slug) do nothing;

insert into public.universities (name, country) values
  ('University of Delhi', 'India'),
  ('University of Mumbai', 'India'),
  ('Savitribai Phule Pune University', 'India'),
  ('Anna University', 'India'),
  ('Visvesvaraya Technological University', 'India'),
  ('Gujarat Technological University', 'India'),
  ('Dr. A.P.J. Abdul Kalam Technical University', 'India'),
  ('CBSE Board', 'India'),
  ('Maharashtra State Board', 'India'),
  ('Indira Gandhi National Open University', 'India')
on conflict (name) do nothing;

insert into public.courses (name) values
  ('Class 11'), ('Class 12'), ('Diploma'), ('BTech'), ('MTech'),
  ('BSc'), ('MSc'), ('BCA'), ('MCA'), ('MBA'), ('BCom'), ('MBBS'),
  ('CA'), ('UPSC'), ('SSC'), ('Banking Exams')
on conflict (name) do nothing;

insert into public.subjects (name) values
  ('Mathematics'), ('Physics'), ('Chemistry'), ('Biology'),
  ('Data Structures'), ('Algorithms'), ('Operating Systems'),
  ('Database Management Systems'), ('Computer Networks'),
  ('Machine Learning'), ('Software Engineering'), ('Thermodynamics'),
  ('Engineering Mechanics'), ('Digital Electronics'), ('Microprocessors'),
  ('Accountancy'), ('Economics'), ('Business Studies'),
  ('Anatomy'), ('Pharmacology'), ('Indian Polity'), ('General Studies')
on conflict (name) do nothing;

insert into public.tags (name) values
  ('exam-prep'), ('previous-year'), ('semester-1'), ('semester-2'),
  ('important-questions'), ('solved'), ('handwritten'), ('summary'),
  ('unit-wise'), ('full-syllabus')
on conflict (name) do nothing;
