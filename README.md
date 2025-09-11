# FisioNet

Radim za ocenu 10

## Opis
**FisioNet** je informacioni sistem i zajednička platforma za pacijente, fizioterapeute, moderatore i administratore.  
Cilj sistema je da omogući:
- jednostavnu pretragu i izvođenje vežbi,  
- zakazivanje termina kod fizioterapeuta,  
- komunikaciju i praćenje terapija,  
- deljenje iskustava putem foruma.  

Aplikacija bi bila dostupna kroz **web klijent (osnovni projekat)** i **mobilnu aplikaciju (diplomski deo)**.

---

## Uloge korisnika

### Neulogovani korisnici
- Pregled osnovnih vežbi (tekst + slike/video).  
- Pretraga i filtriranje vežbi na osnovnom nivou.  
- Pregled liste fizioterapeuta (bez rasporeda termina).  

### Pacijenti (ulogovani)
- Registracija (ime, prezime, email, telefon, datum rođenja, visina, težina, tip posla, profilna slika).  
- Pregled osnovnih i specijalizovanih vežbi (po preporuci fizioterapeuta).  
- Zakazivanje termina (20 min slotovi, mogućnost spajanja).  
- Pregled kalendara terapija i termina (sa integracijom u Google/Outlook kalendar).  
- Chat sa fizioterapeutima (tekst, slike, dokumenta).  
- Dobijanje recepata (plan terapija raspoređen na nedeljnom nivou).  
- Notifikacije i reminderi (dan/sat pre termina, motivacione poruke, obaveštenja).  
- Učešće na forumu (kreiranje tema, komentari).  

### Fizioterapeuti
- Profil sa osnovnim informacijama, slikom i sertifikatima.  
- Upravljanje rasporedom termina.  
- Dodeljivanje specijalizovanih vežbi pacijentima.  
- Upravljanje planovima terapija (receptima).  
- Chat sa pacijentima.  
- Mogućnost ocenjivanja i komentara od strane pacijenata.  

### Moderatori
- Moderacija foruma (brisanje neprikladnog sadržaja, zaključavanje tema).  

### Administratori
- Upravljanje korisnicima (blokiranje, brisanje naloga).  
- Upravljanje sadržajem (dodavanje/brisanje vežbi, administracija foruma).  
- Pregled izveštaja i statistika.  

---

## Funkcionalnosti

- Pretraga i filtriranje vežbi.  
- Pregled vežbi (tekst, slike, YouTube video linkovi).  
- Zakazivanje termina kod fizioterapeuta.  
- Upravljanje kalendarom i receptima terapija.  
- Chat između pacijenata i terapeuta.  
- Forum (diskusije, komentari, glasanje).  
- Notifikacije i reminderi.  
- Administracija korisnika i sadržaja.  

---

## Arhitektura

### Mikroservisi (Rust)
- `auth_service` → registracija, login, autentikacija.  
- `exercise_service` → CRUD operacije nad vežbama, kategorije, video linkovi, slike.  
- `appointment_service` → upravljanje terminima, receptima, kalendarom.  
- `forum_service` → postovi, komentari, glasanje, moderacija.  
- `chat_notification_service` → real-time chat i sistem notifikacija.  

### Baze podataka
- **SQL (SQLite / PostgreSQL)** za korisnike, vežbe, termine, forum.  
- **NoSQL (Redis/MongoDB)** za chat i notifikacije.  

### Storage
- Cloud (S3 ili ekvivalent) za slike i video materijale.  
- YouTube linkovi za vežbe (radi uštede memorije).  

### DevOps - potencijalno za diplomski
- Docker za kontejnerizaciju.  
- CI/CD (GitHub Actions).  
- Monitoring (Prometheus + Grafana).  
- Deployment na cloud (AWS / DigitalOcean).  

---

## Mobilna aplikacija (Diplomski deo)

Mobilna aplikacija razvijena u **Flutter-u** za Android/iOS, povezana sa backend servisima.

### Funkcionalnosti
- Login i registracija.  
- Pregled i filtriranje vežbi.  
- Pregled profila fizioterapeuta.  
- Zakazivanje termina i pregled kalendara.  
- Chat sa terapeutima (tekst + slike + dokumenta).  
- Push notifikacije (Firebase Cloud Messaging).  
- Forum (diskusije i komentari).  
- Offline keširanje vežbi i planova (lokalna baza).  
- Integracija sa Google/Outlook kalendarom.  
- Video konsultacije (Zoom/Jitsi integracija).  

---

## Razdvajanje projekta

### Osnovni projekat (MVP)
- Web aplikacija (frontend + backend).  
- Autentikacija i registracija.  
- Pregled i filtriranje vežbi.  
- Zakazivanje termina i pregled kalendara.  
- Chat (osnovna razmena poruka).  
- Forum (osnovna verzija: teme + komentari).  
- Administracija korisnika i sadržaja.  

### Diplomski deo (Proširenja)
- Mobilna aplikacija (Flutter).  
- Push notifikacije i reminderi.  
- Chat sa fajlovima i real-time WebSocket podrškom.  
- Offline cache i lokalna baza u aplikaciji.  
- Forum sa ocenjivanjem i stručnim oznakama odgovora.  
- Integracija sa eksternim kalendarima.  
- Video konsultacije (online terapije).  
- DevOps proširenja: CI/CD pipeline, monitoring, cloud deployment.  
