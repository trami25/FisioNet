# VolleyNet

## Opis problema
Trenutno ne postoji centralizovana platforma za praćenje karijere odbojkaša i odbojkašica.  
**VolleyNet** rešava ovaj problem omogućavajući ljubiteljima odbojke da pregledaju igrače, njihove statistike, mečeve i video materijale, a klubovima, selektorima i adminima da upravljaju sadržajem.

---

## Specifikacija funkcionalnosti

### 1. Funkcionalnosti za **neulogovane korisnike**
1.1. Pretraga igrača po imenu, prezimenu i klubu.  
1.2. Filtriranje igrača po poziciji, tržišnoj vrednosti i broju poena.  
1.3. Pregled statusa igrača: klub, reprezentacija, oba ili neaktivan.  
1.4. Ako igrač igra za reprezentaciju, prikaz države.  
1.5. Pregled referenciranih mečeva i osnovne statistike.  
1.6. Pregled slika igrača u **klupskom i reprezentativnom dresu**.

---

### 2. Funkcionalnosti za **ulogovane korisnike**
2.1. Ocenjivanje igrača (1–5).  
2.2. Komentarisanje igrača.  
2.3. Pregled istorije svojih komentara i ocena.
2.4. Pregled video materijala vezanih za igrača ili meč.  

---

### 3. Funkcionalnosti za **moderatora**
3.1. Dodavanje, ažuriranje i brisanje video materijala (YouTube linkovi).  
3.2. Dodavanje i ažuriranje referenciranih mečeva i statistike učinka igrača.  
3.3. Upravljanje komentarima korisnika (brisanje neprimerenih komentara).  
3.4. Dodavanje i ažuriranje slika igrača (klupski/reprezentativni dres).

---

### 4. Funkcionalnosti za **admina**
4.1. Sve funkcionalnosti moderatora.  
4.2. Upravljanje korisnicima: dodavanje, brisanje, dodeljivanje uloge.  
4.3. Upravljanje igračima: dodavanje novih, ažuriranje i brisanje.  
4.4. Upravljanje eksperimentima: pokretanje, praćenje i vizualizacija rezultata.  

---

## Arhitektura sistema
1. **Backend (Rust)**  
   - API za igrače, mečeve, video, komentare i ocene.  
   - Implementacija eksperimenata sa paralelnim i sekvencijalnim algoritmima.  
2. **Frontend (Pharo ili web)**  
   - Interfejs za pretragu, filtriranje, ocenjivanje, komentare, pregled mečeva i videa.  
3. **Baza podataka (PostgreSQL)**  
   -- Tabele: `korisnik`, `reprezentacija`, `igrac`, `slika`, `mec`, `igrac_mec`, `video`, `komentar`. ...

---

## Tehnologije
- **Rust** – backend i eksperimenti  
- **Python** – paralelni/sekevencijalni eksperimenti  
- **PostgreSQL** – baza podataka  
- **Pharo / Web frontend** – korisnički interfejs  
- **Plotters (Rust)** – vizualizacija rezultata  

---

## Plan eksperimenata
1. Implementacija algoritma za obradu velikih datasetova igrača i statistika.  
2. Python implementacija: sekvencijalna i paralelizovana varijanta.  
3. Rust implementacija: sekvencijalna i paralelizovana varijanta.  
4. Eksperimenti jakog i slabog skaliranja.  
5. Merenje vremena izvršavanja i ubrzanja.  
6. Vizualizacija rezultata grafički (vreme izvršavanja, ubrzanje, iteracije).  

---

## Rezultati eksperimenata
### Python implementacija
- Sekvencijalna varijanta:  
- Paralelizovana varijanta:  
- Dobijeno ubrzanje:  

### Rust implementacija
- Sekvencijalna varijanta:  
- Paralelizovana varijanta:  
- Dobijeno ubrzanje:  

### Poređenje jakog i slabog skaliranja
*(grafikoni i tabele sa podacima)*

---

## Vizualizacija
- Vreme izvršavanja vs. broj jezgara  
- Ubrzanje vs. veličina problema  
- Iterativni prikaz po koracima  

