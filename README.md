# **VolleyNet** 

**Projekat radim za ocenu 10.**

### **Cilj:**

Web aplikacija koja omogućava ljubiteljima odbojke i stručnim timovima da prate:

- Karijeru igrača i igračica
- Status igrača (klub, reprezentacija, oba ili neaktivan)
- Državu reprezentacije
- Statistiku iz mečeva
- Tip takmičenja: Svetsko prvenstvo, Evropsko prvenstvo, Liga šampiona / klupsko prvenstvo, Nacionalna liga, Prijateljski mečevi
- Video reference (YouTube)
- Slike u klupskom i reprezentativnom dresu
- Ocene i komentare korisnika

Sistem omogućava moderatorima i adminima da upravljaju sadržajem i korisnicima, dok fanovi mogu pregledati, filtrirati i komentarisati igrače i mečeve.

VolleyNet je inspirisan sajtom **VolleyBox**, ali unapređen sa:

- Mikroservisnom arhitekturom
- Višestrukim bazama (PostgreSQL i SQLite)
- Vizualizacijom performansi i statistike
- Naprednim filtriranjem i pretragom
- Ulogama korisnika i role-based pristupom

---

### **Tehnologije:**

* **Backend:** Rust (mikroservisi)  
* **Frontend:** Pharo / Web (tekstualni terminal ili web interfejs)  
* **Baze:** PostgreSQL (igrači, korisnici, komentari), SQLite (mečevi, statistika, mediji, takmičenja)  
* **Upload:** Slike i video reference preko URL-a / cloud storage  
* **Autentikacija:** JWT + role-based access (Neulogovani, Ulogovani, Moderator, Admin)

---

### **Funkcionalnosti**

#### **1. Neulogovani korisnici**
1. Pretraga igrača po imenu, prezimenu i klubu  
2. Filtriranje po poziciji, tržišnoj vrednosti i broju poena  
3. Pregled statusa igrača (klub / reprezentacija / oba / neaktivan)  
4. Prikaz države ako igrač igra za reprezentaciju  
5. Pregled referenciranih mečeva i statistike  
6. Pregled video materijala (YouTube linkovi)  
7. Pregled slika igrača (klupski i reprezentativni dres)  
8. Pregled mečeva po tipu takmičenja i sezoni

#### **2. Ulogovani korisnici**
1. Ocenjivanje igrača (1–5)  
2. Komentarisanje igrača  
3. Pregled istorije svojih komentara i ocena  
4. Praćenje omiljenih igrača i timova  

#### **3. Moderator**
1. Dodavanje, ažuriranje i brisanje video materijala (YouTube)  
2. Dodavanje i ažuriranje mečeva i statistike igrača  
3. Upravljanje komentarima korisnika (brisanje neprimerenih)  
4. Dodavanje i ažuriranje slika igrača  
5. Dodavanje i održavanje takmičenja i sezona  

#### **4. Admin**
1. Sve funkcionalnosti moderatora  
2. Upravljanje korisnicima: dodavanje, brisanje, dodeljivanje uloga  
3. Upravljanje igračima: dodavanje, ažuriranje, brisanje  
4. Upravljanje mikroservisima i bazama po potrebi  

---

### **Mikroservisna arhitektura**

| Mikroservis | Funkcionalnosti | Baza podataka |
| ------------ | --------------- | ------------- |
| **Player Service** | CRUD operacije za igrače, status, reprezentacija, slike | PostgreSQL |
| **Match Service** | CRUD za mečeve, statistika igrača | SQLite |
| **Media Service** | Upravljanje video linkovima i slikama | SQLite |
| **User & Comment Service** | Korisnici, autentikacija, komentari i ocene | PostgreSQL |
| **Competition Service** | Upravljanje takmičenjima i sezonama (svetsko, evropsko, klupsko, nacionalna liga) | SQLite |


---

### **Uloge u sistemu**

| Uloga | Opis | Glavne odgovornosti |
| ----- | ----- | ------------------ |
| **Neulogovani korisnik** | Pregled i pretraga sadržaja | Pregled igrača, mečeva, videa i slika |
| **Ulogovani korisnik** | Aktivno učestvuje u sistemu | Komentari, ocene, istorija aktivnosti, praćenje omiljenih igrača/timova |
| **Moderator** | Upravlja medijskim i statističkim sadržajem | Dodavanje/brisanje video linkova, slika, mečeva, takmičenja, moderacija komentara |
| **Administrator** | Upravljanje korisnicima i mikroservisima | Dodavanje/brisanje korisnika, igrača, nadzor sistema, upravljanje servisima |

---



