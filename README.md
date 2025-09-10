# **FisioNet – Platforma za fizioterapiju i savete**

**Projekat radim za ocenu 10.**

### **Cilj:**

Terminal i web aplikacija koja omogućava:

- Fizioterapeutima da dele vežbe, savete i vodiče  
- Pacijentima da prate vežbe, postavljaju pitanja i komentare  
- Grupama i forumima za razmenu iskustava  
- Pretragu vežbi po tipu problema (npr. kičma, koleno, rameni pojas)  
- Praćenje napretka pacijenata  
- Video i slike vežbi, uputstva i reference  
- Dogovaranje konsultacija i online sesija  

Sistem omogućava moderatorima i adminima da upravljaju sadržajem, dok korisnici mogu pregledati, filtrirati, komentarisati i oceniti savete i vežbe.

---

### **Tehnologije:**

* **Backend:** Rust (mikroservisi)  
* **Frontend:** Pharo / Web  
* **Baze:** PostgreSQL (korisnici, komentari, ocene), SQLite (vežbe, video, slike, sesije)  
* **Upload:** Video i slike vežbi preko URL-a / cloud storage  
* **Autentikacija:** JWT + role-based access (Neulogovani, Ulogovani, Moderator, Admin, Fizioterapeut)

---

### **Funkcionalnosti**

#### **1. Neulogovani korisnici**
1. Pretraga vežbi po tipu problema ili telu  
2. Filtriranje po težini, opremi, vremenu izvođenja  
3. Pregled video i slikovnih uputstava  
4. Pregled saveta i opštih vodiča za fizioterapiju  

#### **2. Ulogovani korisnici (pacijenti)**
1. Praćenje vežbi i napretka  
2. Ocenjivanje i komentarisanje vežbi  
3. Postavljanje pitanja fizioterapeutima  
4. Kreiranje liste omiljenih vežbi i vodiča  

#### **3. Fizioterapeuti**
1. Dodavanje, ažuriranje i brisanje vežbi i saveta  
2. Kreiranje video i slikovnih uputstava  
3. Odgovaranje na pitanja pacijenata  
4. Praćenje statistike uspeha vežbi  

#### **4. Moderator**
1. Upravljanje sadržajem: brisanje neprimerenih komentara i vežbi  
2. Verifikacija fizioterapeuta i njihovih objava  

#### **5. Admin**
1. Sve funkcionalnosti moderatora  
2. Upravljanje korisnicima i fizioterapeutima: dodavanje, brisanje, dodeljivanje uloga  
3. Upravljanje mikroservisima i bazama  

---

### **Mikroservisna arhitektura**

| Mikroservis | Funkcionalnosti | Baza podataka |
| ------------ | --------------- | ------------- |
| **Exercise Service** | CRUD za vežbe, savete, vodiče | SQLite |
| **User & Comment Service** | Korisnici, autentikacija, komentari i ocene | PostgreSQL |
| **Media Service** | Upravljanje video i slikovnim uputstvima | SQLite |
| **Session Service** | Zakazivanje konsultacija i online sesija | SQLite |
 

---
### **Uloge u sistemu**

| Uloga | Opis | Glavne odgovornosti |
| ----- | ----- | ------------------ |
| **Neulogovani korisnik** | Pregled sadržaja | Pregled vežbi, vodiča i video uputstava |
| **Ulogovani korisnik (pacijent)** | Aktivno učestvuje | Praćenje vežbi, ocene i komentari, pitanja fizioterapeutima |
| **Fizioterapeut** | Objavljuje sadržaj i vodi pacijente | Dodavanje vežbi, saveta, odgovaranje na pitanja, praćenje uspeha |
| **Moderator** | Kontrola sadržaja | Brisanje neprimerenih komentara i vežbi, verifikacija fizioterapeuta |
| **Administrator** | Upravljanje korisnicima i servisima | Dodavanje/brisanje korisnika, nadzor sistema, upravljanje mikroservisima |

