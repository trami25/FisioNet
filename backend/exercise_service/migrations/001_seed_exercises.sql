-- Insert sample exercises into the database

INSERT INTO exercises (
    title, description, category, difficulty_level, duration_minutes,
    equipment_needed, instructions, image_url, video_url, youtube_url,
    target_muscles, created_at, is_specialized
) VALUES 
(
    'Sklekovi (Push-ups)',
    'Klasična vežba za jačanje gornjeg dela tela koja angažuje grudi, ramena i triceps. Odlična za razvoj funkcionalне snage i stabilnosti kora.',
    'Strength',
    'Beginner',
    10,
    '[]',
    '["Postavite ruke na širini ramena na podu", "Telo držite u ravnoj liniji od glave do stopala", "Spustite se kontrolisano dok grudi ne dodirnu pod", "Gurnite se nazad u početnu poziciju", "Održavajte napete trbušne mišiće tokom celog pokreta"]',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600',
    NULL,
    'https://www.youtube.com/watch?v=IODxDxX7oi4',
    '["Grudi", "Ramena", "Triceps", "Core"]',
    strftime('%s', 'now'),
    0
),
(
    'Čučnjevi (Squats)',
    'Osnovna vežba za donji deo tela koja jača noge, gluteuse i stabilizatore. Poboljšava funkcionalnu snagu neophodnu za svakodnevne aktivnosti.',
    'Strength',
    'Beginner',
    15,
    '[]',
    '["Stanite sa nogama na širini ramena", "Prsti blago okrenuti napolje", "Spustite se u čučanj kao da sedаte na stolicu", "Kolena ne smeju da prelaze prste", "Održavajte leđa ravno i pogled napred", "Gurnite se preko peta nazad u početnu poziciju"]',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600',
    NULL,
    'https://www.youtube.com/watch?v=aclHkVaku9U',
    '["Kvadriceps", "Gluteus", "Zadnja loža", "Core"]',
    strftime('%s', 'now'),
    0
),
(
    'Plank',
    'Izometrička vežba za jačanje core mišića, leđa i ramena. Odlična za poboljšanje stabilnosti i posture.',
    'Core',
    'Beginner',
    5,
    '["Yoga prostirka"]',
    '["Oslonite se na podlaktice i prste nogu", "Telo držite u ravnoj liniji", "Laktovi direktno ispod ramena", "Ne dozvolite da kukovi padaju ili se dižu", "Napnite trbušne mišiće", "Zadržite poziciju 30-60 sekundi"]',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
    NULL,
    'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    '["Core", "Ramena", "Leđa"]',
    strftime('%s', 'now'),
    0
),
(
    'Yoga Flow - Sun Salutation',
    'Serija joga pokreta koji poboljšavaju fleksibilnost, ravnotežu i mentalnu fokusiranost. Idealno za jutarnje zagrevanje.',
    'Flexibility',
    'Intermediate',
    20,
    '["Yoga prostirka"]',
    '["Počnite u Mountain Pose (Tadasana)", "Izdahnite i savijte se napred (Forward Fold)", "Izdahnite i uđite u Plank poziciju", "Spustite se u Chaturanga", "Udahnite i uđite u Upward Dog", "Izdahnite i uđite u Downward Dog", "Zadržite 5 dubоkih udisaja", "Ponovite sekvencu 5 puta"]',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
    NULL,
    'https://www.youtube.com/watch?v=73sjOu0g58E',
    '["Celo telo", "Core", "Ramena", "Leđa"]',
    strftime('%s', 'now'),
    0
),
(
    'Balance Board Training',
    'Napredne vežbe za razvoj propriocepcije, ravnoteže i stabilnosti zglobova. Korisno za prevenciju povreda i rehabilitaciju.',
    'Balance',
    'Advanced',
    12,
    '["Balance board", "Sigurna površina"]',
    '["Stanite na balance board sa nogama na širini kukova", "Prvo vežbajte sa podrškom (zid ili stolica)", "Pokušajte održati ravnotežu 30 sekundi", "Kada steknete kontrolu, dodajte pokrete ruku", "Probajte zatvarati oči za veći izazov", "Izvodite male čučnjeve na boardu"]',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600',
    NULL,
    'https://www.youtube.com/watch?v=example',
    '["Core", "Noge", "Zglobovi"]',
    strftime('%s', 'now'),
    0
),
(
    'Resistance Band Shoulder Exercises',
    'Set vežbi za jačanje i rehabilitaciju ramena koristeći elastične trake. Idealno za oporavak nakon povreda.',
    'Rehabilitation',
    'Intermediate',
    15,
    '["Resistance band (srednji otpor)", "Fiksna tačka za traku"]',
    '["External rotation: Držite lakat uz telo, rotirajte podlakticu napolje", "Internal rotation: Obrnuto od eksterne rotacije", "Lateral raise: Podignite ruke sa strane do visine ramena", "Front raise: Podignite ruke ispred sebe", "Face pull: Povucite traku prema licu", "Napravite 2-3 serije od 12-15 ponavljanja"]',
    'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600',
    NULL,
    'https://www.youtube.com/watch?v=example',
    '["Ramena", "Rotatorna манжетna", "Gore leđa"]',
    strftime('%s', 'now'),
    1
);

-- Verify the inserts
SELECT COUNT(*) as total_exercises FROM exercises;
SELECT title, category, difficulty_level FROM exercises ORDER BY created_at DESC LIMIT 6;