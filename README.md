# FisioNet

## Opis projekta
Ova aplikacija je namenjena fizioterapeutima, pacijentima i običnim korisnicima za interakciju, edukaciju i praćenje napretka kroz rehabilitacione vežbe.  
Platforma omogućava:  
- Fizioterapeutima da dele vežbe, savete i vodiče.  
- Pacijentima da prate vežbe, postavljaju pitanja i komentare.  
- Kreiranje grupa i foruma za razmenu iskustava.  
- Zakazivanje **online i uživo termina**.  
- Slanje **notifikacija i podsetnika** pacijentima i fizioterapeutima.  

Aplikacija se sastoji iz **terminal aplikacije** i **web interfejsa**.  

---

## ⚙Tehnologije
- **Backend:** Rust (mikroservisi, REST API)  
- **Frontend:** Pharo / Web  
- **Baze podataka:**  
  - PostgreSQL – korisnici, komentari, ocene, notifikacije  
  - SQLite – vežbe, multimedija, sesije  
- **Autentikacija:** JWT + role-based access  
- **Upload medija:** URL ili cloud storage (npr. AWS S3, GCP Storage, MinIO)  
- **Notifikacije:** Email, Push, Reminderi (cron job)  

---

## 🧩 Mikroservisna arhitektura
| Mikroservis             | Funkcionalnosti | Baza        |
|-------------------------|-----------------|-------------|
| **Exercise Service**    | CRUD za vežbe, vodiče i savete | SQLite |
| **User & Comment Service** | Upravljanje korisnicima, autentikacija, komentari i ocene | PostgreSQL |
| **Media Service**       | Upload i prikaz multimedijalnih sadržaja | SQLite |
| **Session Service**     | Zakazivanje online/uživo konsultacija, kalendar termina | SQLite |
| **Notification Service**| Reminderi i obaveštenja (email, push) | PostgreSQL |

---

## Uloge u sistemu
| Uloga                  | Opis | Glavne odgovornosti |
|------------------------|------|----------------------|
| **Neulogovani korisnik** | Pasivan korisnik | Pretraga i pregled sadržaja |
| **Pacijent**           | Aktivni korisnik | Praćenje vežbi, ocenjivanje i komentarisanje, zakazivanje termina |
| **Fizioterapeut**      | Autor i vodič | Dodavanje vežbi, odgovaranje pacijentima, kreiranje vodiča |
| **Moderator**          | Kontrolor sadržaja | Brisanje neprimerenih sadržaja, verifikacija fizioterapeuta |
| **Administrator**      | Nadzor sistema | Upravljanje korisnicima, ulogama i mikroservisima |

---

## Funkcionalni zahtevi po ulogama

### 1. Neulogovani korisnici
- Pretraga vežbi po tipu problema (npr. kičma, koleno, rame).  
- Filtriranje vežbi po težini, potrebnoj opremi i vremenu izvođenja.  
- Pregled video i slikovnih uputstava.  
- Pregled javnih saveta i vodiča.  

### 2. Ulogovani korisnici (pacijenti)
- Sve mogućnosti neulogovanih korisnika.  
- Praćenje vežbi i napretka.  
- Ocenjivanje i komentarisanje vežbi.  
- Postavljanje pitanja fizioterapeutima.  
- Kreiranje liste omiljenih vežbi i vodiča.  
- Zakazivanje online i uživo termina.  
- Primanje notifikacija i podsetnika (vežbe, termini).  

### 3. Fizioterapeuti
- Sve mogućnosti pacijenata.  
- Dodavanje, ažuriranje i brisanje vežbi i saveta.  
- Kreiranje video i slikovnih uputstava.  
- Odgovaranje na pitanja pacijenata.  
- Praćenje statistike uspeha vežbi.  
- Upravljanje sopstvenim rasporedom konsultacija.  

### 4. Moderatori
- Sve mogućnosti fizioterapeuta.  
- Brisanje neprimerenih komentara i sadržaja.  
- Verifikacija fizioterapeuta i njihovih objava.  
- Upozoravanje korisnika ili blokiranje naloga (privremeno).  

### 5. Administratori
- Sve mogućnosti moderatora.  
- Dodavanje, brisanje i upravljanje korisnicima i fizioterapeutima.  
- Dodeljivanje i menjanje uloga korisnicima.  
- Upravljanje mikroservisima i bazama podataka.  
- Monitoring sistema i statistike korišćenja.  

---

## Notifikacije i Reminderi
- Podsetnici za vežbe i zakazane termine.  
- Notifikacije o novim pitanjima, komentarima i konsultacijama.  
- Motivacione poruke pacijentima.  
- Email i push integracija.  

---

## Zakazivanje termina
- **Online konsultacije** (video call preko WebRTC).  
- **Uživo termini** u ordinaciji ili sali.  
- Automatski reminder 24h i 1h pre termina.  
- Export u kalendar (iCal format).  

