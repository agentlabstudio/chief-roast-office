# Chief Roast Office: riippumaton peli- ja Chief-arvio

15.10.2026. Rajattu sisäinen AI-kehitysarvio; ei ulkopuolinen pelaaja, asiakashaastattelu tai ihmispelitesti. Tavoite: kolme vaikuttavinta muutosta ennen sunnuntain 18.10.2026 iltaa Helsingin aikaa.

## Johtopäätös ja päätökset nyt

Toimiston tunnistettava ääni on jo olemassa. Printerin urahaaveet, Chiefin menetetty viimeinen sana, harjoittelijan hyödyllisyys ja varattu tuoli muodostavat yhteisen komediamaailman. Suurin viikonlopun hyöty tulee siitä, että pelaaja joutuu valitsemaan kahden uskottavan hyödyn välillä ja näkee oman valintansa seurauksen. Uusia tapauksia tai loppuja ei tarvitse tilata tämän todistamiseksi.

Tein palautettavan muutoksen omaan kopioon: CASE-021:n `plain/show`-jatkon kahdesta vastauksesta tuli aidompi aikavalinta. Harjoittelija voi opettaa uuden henkilön nyt ja myöhästyä toisesta tehtävästä, tai Chiefin varatermos hoitaa tämän tauon, määräaika säilyy ja opetus jää seuraavalle vuorolle. Kummankin hinnan voi ymmärtää ennen valintaa. Molemmat saavat oman vitsin ja käyttökelpoisen seuraavan tehtävän. Sama kohtaus, samat kaksi reittiä; ei lisää sisältömäärää.

Rajatussa jatkotoimeksiannossa toteutin myös kohdan 2: jokainen ensimmäinen kuitti saa oman seuraukseen liittyvän ensisijaisen jatkonappinsa. Teksti kertoo yhden lisäpäätöksen olevan tarjolla heti. Uusinta säilyy tavallisena toissijaisena nappina. Uuden sisällön tarkka palautetunniste on `coffee-20261015-review`; molemmat aiemmat tunnisteet hyväksytään edelleen vanhoille konteksteille.

Muutos on valmis omistajan integraatiopäätökseen. Älä laajenna sitä tämän arvion perusteella koko pelin pisteuudistukseksi. Ei julkaistu, ei muutettu päähaaraa, ei koskettu yksityiseen CASE-021-kuvaan. Julkaisulle ennestään asetettu oikean selaimen tarkistus on edelleen tekemättä.

## Mitä todella tarkastin

- Julkinen `personnel-game.html` täsmällisestä main-versiosta `f806ffe802cb971e338e2bd4419087c68a63d31c`: HTML, kaikki 11 päätöstilannetta, vaikutukset, palautteet, 8 roolikorttia, tarinan valinta, vuoronvaihto, paikallinen tallennus ja näkyvät jatkokehotteet.
- Saman julkisen version `assets/personnel-repair-model.js`, `assets/personnel-repair.js` ja `assets/personnel-office-scene.js`: korjauspöydän säännöt, seitsemän kiertävää työmääräystä, aiempien päätösten vaikutus ja toimistokuvan tilapeilaus.
- Rajattu ehdokas `work/game-next/candidate/case-021.html`, sen `assets/office-signals.js`, `DELIVERY.md`, aiempi fixture ja `coffee-return.cjs`. Toimeksiannon ilmoittama ehdokashaara on `work/case021-coffee-20261015` / `f95b215d66d5b6af0076cda7cc742bf96ff76c5d`. Paikallisen DELIVERY-tiedoston pohjaversio on vanhempi; en käsittele sitä todisteena nykyisen etähaaran sisällöstä.
- Julkisten lähteiden luetut kopiot ovat tässä kansiossa tunnisteella `public-`. En lukenut master-strategiaa, yksityistä kuvatiedostoa tai muiden arvioijien strategiaa. En käyttänyt liikenne- tai palautetilastoja.

Lähteet: [julkinen peli](https://agentlabstudio.github.io/chief-roast-office/personnel-game.html), [tarkastettu lähdeversio](https://github.com/agentlabstudio/chief-roast-office/blob/f806ffe802cb971e338e2bd4419087c68a63d31c/personnel-game.html), [korjauspöydän säännöt](https://github.com/agentlabstudio/chief-roast-office/blob/f806ffe802cb971e338e2bd4419087c68a63d31c/assets/personnel-repair-model.js).

En avannut peliä oikeassa selaimessa, nähnyt uuden ehdokkaan asettelua tai kuvien latausta, testannut fyysistä puhelinta tai seurannut ihmisen pelaamista. Arvio koskee lähteessä näkyvää rakennetta ja tekstiä. En käyttänyt ajankohtaisia markkinavertailuja; alla olevat vaikutusarviot ovat suunnitteluhypoteeseja, eivät mitattua käyttäytymistä.

## Kolme tärkeintä muutosta järjestyksessä

| Sija | Muutos ennen sunnuntaita | Miksi tällä on arvoa | Rajattu onnistumisen havainto |
|---|---|---|---|
| 1 | Tee yhdestä jatkotilanteesta oikea valinta kahden hyödyn välillä. Toteutettu omassa kopiossa. | Vastauksen valitseminen tuntuu omalta ratkaisulta. Pelkän oikean toimistokäytöksen tunnistaminen ei vielä kanna toista pelikertaa. | Ihminen pystyy perustelemaan kummankin vaihtoehdon ja kertomaan, mitä omasta valinnasta seurasi. |
| 2 | Näytä kuittiin liittyvä avoin kysymys seuraavan vuoron kutsussa. Toteutettu omassa kopiossa kuudelle reitille; `plain/show`: “Next shift: teach now or protect a deadline →”. | Aiempi “Try the next shift” myy lisää määrää. Kuittiin liittyvä ongelma myy seurauksen ja antaa syyn jatkaa. | Pelaaja osaa ennen klikkausta sanoa, mihin keskeneräiseen asiaan hän palaa. |
| 3 | Järjestä henkilöstöpelin lopussa yksi selkeä ensisijainen seuraava toimistotehtävä. Valitse korjauspöytä tai CASE-021 kyseiseen hetkeen, pidä muut linkit saatavilla alempana. | Lopussa kilpailevat paluuvuoro, uusinta, korjauspöytä, quiet-hour, Telegram, kopiointi ja jakaminen. Yhteinen toimisto tarvitsee ymmärrettävän seuraavan työn, ei lisää ovia. | Ensikertalainen löytää seuraavan tehtävän ilman ohjausta ja erottaa verkkopelin Telegram-botista. |

Kohta 3 jää täsmälliseksi seuraavaksi kokeiluksi. Henkilöstöpeliä ei muutettu tässä paketissa. Älä muuta sen kaikkia loppukehoitteita kerralla: silloin lyhyestä ihmistestistä ei selviä, mikä auttoi.

## Pelattavuus: missä valinta jo toimii ja missä se heikkenee

Henkilöstöpelin vaihtoehtojen alkuperäisissä taulukkoindekseissä 0 päihittää vaihtoehdon 2 kaikilla kolmella pisteakselilla jokaisessa 11 tilanteessa. Se päihittää vaihtoehdon 1 samalla tavalla 7 tilanteessa 11:stä. Tässä “päihittää” tarkoittaa vähintään yhtä hyvää lukua kaikilla akseleilla ja parempaa vähintään yhdellä; näytön vaihtoehtojärjestystä vaihdellaan, joten kyse ei ole aina ylimmän napin painamisesta. Käyttäjä ei myöskään näe näitä vaikutuslukuja etukäteen. Havainto kuvaa sääntöjä, ei toteutunutta pelaajavalintaa.

Selvästi hölmö vaihtoehto voi olla erinomainen komedianappi. Ongelma ei ole sen olemassaolo. Ongelma syntyy, jos myös toinen asiallinen vaihtoehto on lähes aina huonompi ja väitetty hinta (“few minutes now”) ei muuta mitään myöhemmin. Silloin oppii lukemaan kirjoittajan arvot eikä kokeilemaan toimiston ratkaisuja.

Korjauspöytä parantaa tätä aidosti: käytettävissä olevat minuutit, näyttö, meluraja ja harjoittelijan valtuudet rajoittavat toimintaa. Myös CASE-021:n `plain/point`, `none/assign` ja `none/wait` tarjoavat käyttökelpoisia vaihtoehtoja. Näitä kannattaa suojella. Oma muutos nostaa yhden aiemmin helposti ratkaistavan `plain/show`-jatkon samaan suuntaan.

## Huumori ja Chief

Vahvin Chief menettää jotakin pientä itse: puheen, tittelivallan, viimeisen sanan tai paperinsa valvontaoikeuden. “My cover sheet is unemployed” toimii, koska esineen asema muuttuu ja Chief suhtautuu siihen vakavasti. Harjoittelija ei ole pilkan kohde vaan pätevä toimija. Se tekee toimistosta paikan, johon voi haluta tulla takaisin.

Heikompi kohta on toistuva rakenne: kelvollinen pieni teko vastaan näyttävä puhe, sitten Chief selittää opetuksen. Usein sekä vaihtoehdon huomautus, tapahtumateksti, seuraava tehtävä että Chief lausuvat saman opetuksen. Viikonlopun toimituksellinen sääntö: yksi selitys, yksi tapahtuma, yksi varsinainen vitsi. Älä lisää neljättä sanamuotoa saman väitteen tueksi.

Oman muutoksen vitsit jakavat piikin molempiin ratkaisuihin. Myöhästynyt tehtävä pyytää omaa tekijää; määräajan pelastanut termospullo uhkaa saada palkan. Chief pysyy henkilönä ja toimisto kokonaisuutena. Termospullo on uusi pieni rekvisiitta, ei kuvan tai kokonaisen hahmon uudistus.

## Paluumotivaatio ja toimiston yhtenäisyys

Paluuvuoro tunnistaa ensimmäisen roolikortin, mutta sen viisi kohtausta ovat samoja ensimmäisen vuoron yksityiskohdista riippumatta. Korjauspöydässä aiempien päätösten vaikutus on konkreettisempi. Kahvijatko puolestaan näyttää ensimmäisen kuitin ja valitsee seuraavan tilanteen sen perusteella. Tämä on hyvä syy käyttää juuri sitä pienenä jatkuvuuskokeiluna.

Kahvijatko on saman istunnon lisäpäätös. Sen oma teksti lupaa nollautumisen sivun latauksessa eikä se tallenna. Sitä ei pidä raportoida näyttönä myöhemmin palaamisesta tai monipäiväisestä sitoutumisesta. Korjauspöydän seitsemän työmääräystä kiertävät päivittäin samoilla perussäännöillä; tämä on tuotteen tarjoama syy palata, ei todiste siitä, että ihmiset palaavat.

Chief, harjoittelija, printeri, tuoli ja kuittimuoto pitävät kokonaisuuden koossa. Otsikoiden vaihtelua “Chief Roast Officer / Office” ja eri palveluiden lopetuskehotteita on silti syytä katsoa yhdellä oikealla läpipelauksella. En esitä uutta navigaatioarkkitehtuuria tai uutta brändikierrosta viikonlopun työhön.

## Patch ja rajattu validointi

- Integrointikelpoinen kahden tiedoston diff: `review-improvements.patch`, kohteet `case-021.html` ja `assets/office-signals.js`. Täydet omat kopiot ovat `candidate/`-kansiossa. Vanha `agency-plain-show.patch` sisältää vain ensimmäisen muutoksen; sitä ei pidä lisätä tämän päälle.
- Reitti-ID:t pysyvät ennallaan. Uusi tarkka build-tunniste `coffee-20261015-review` erottaa muuttuneen sisällön. Vanhojen `coffee-20261015`- ja `coffee-20261015-return`-tunnisteiden käsittely säilyy; tuntematon reitti ei päädy kontekstitekstiin.
- `tests/coffee-return.cjs` päivitettiin ja ajettiin omalle kopiolle: PASS, kuusi alkuperäistä kuittia ennallaan, 12 jatkoloppua, kuusi kontekstikohtaista ensisijaista jatkonappia, 56 hylättyä virhetoimintoa tai reittikontekstia, 42 sallittua palautekontekstia, 24 aiempaa kontekstia ennallaan, 12 uusinnan nollausta ja 12 tarkistusta eri reitille uusinnan jälkeen. Uusinta on edelleen käytettävissä toissijaisena. Ei verkkokutsuja tai tallennuksen muutoksia testissä.
- Menetelmä: oikea inline-koodi minimaalisessa simuloidussa DOM:ssa. Ei selainta, asettelutestiä, apuvälinetestiä tai ihmisen pelikokemusta. Palautteen toimittamista ei lähetetty eikä todettu.
- Oma lisätarkistus vertaa muutoksen rajaa ja pistehavaintoja: `validate-review.cjs` ja `review-validation.json`.

## Puuttuva ulkopuolinen ihmispalaute

Puuttuu kokonaan tässä arviossa. Sisäisten AI-arvioiden määrä ei täytä sitä aukkoa.

Hyödyllinen pieni kierros on kolme projektia ennestään tuntematonta, vapaaehtoista ihmistä. Ainakin yksi omalla puhelimellaan. He pelaavat ilman toimistomaailman selitystä: yksi henkilöstövuoro ja kahvin yksi reitti. Kysy vasta lopuksi: mikä valinta tuntui vaikealta, mikä repliikki jäi mieleen, miksi jatkaisit tai lopettaisit tähän, ja missä luulit pelin vaihtuvan toiseen palveluun. Seuraa myös löydetäänkö seuraava tehtävä ilman apua. Älä pyydä pelkkää “oliko hyvä” -arvosanaa.

Raportoi jokaisen havainnon toteutunut määrä ja laite. Älä laske testihenkilöitä asiakkaiksi, simulaatiota pelitestiksi tai saman istunnon kolmatta päätöstä myöhemmäksi paluuksi. Jos aikaa jää yhteen korjaukseen, valitse se kohta, jossa ihminen ei ymmärtänyt seurausta tai seuraavaa toimintoa. Uuden tapausmäärän kasvattaminen ei ratkaise sitä epävarmuutta.
