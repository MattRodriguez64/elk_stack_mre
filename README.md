# ELK STACK MRE (Minimum Reproductible Exemple)
L'objectif de ce dépôt Git est d'avoir tous les composants pour la mise en place de la Stack ELK.
## 1 - Présentation
La Stack ELK est principalement utilisée pour centraliser, normaliser, visualiser et analyser des logs provenant de sources multiples dans un environnement unique et accessible. Elle permet notamment de rechercher des erreurs, surveiller des activités suspectes, détecter des anomalies et superviser une infrastructure.
## 2 - Architecture ![Static Badge](https://img.shields.io/badge/elasticsearch-yellow?logo=elasticsearch) ![Static Badge](https://img.shields.io/badge/logstash-orange?logo=logstash) ![Static Badge](https://img.shields.io/badge/kibana-pink?logo=kibana) ![Static Badge](https://img.shields.io/badge/beats-aqua?logo=beats)
L’architecture ELK repose sur une chaîne de collecte, de traitement, de stockage et de visualisation des données. Les sources peuvent envoyer leurs données directement à Logstash ou passer par des agents Beats. Logstash transforme ensuite les données avant leur envoi vers Elasticsearch, qui les indexe et les stocke. Kibana exploite enfin ces données pour permettre leur analyse et leur visualisation.
<p align="center">
  <img width="512" height="512" alt="Your paragraph text" src="https://github.com/user-attachments/assets/83caf7a1-12da-4709-96ca-054c319d3b80" />
</p>

## 3 - Prérequis ![Static Badge](https://img.shields.io/badge/docker-white?logo=docker) ![Static Badge](https://img.shields.io/badge/docker-compose-white?logo=docker)
Pour l'implémentation de cette Stack et de cet exemple, il est nécessaire d'avoir Docker et Docker Compose d'installés.
## 4 - Installation
1 - Cloner ce dépôt Git :
```sh
git clone https://github.com/MattRodriguez64/elk_stack_mre.git
```
2 - Utiliser docker compose dans le fichier pour construire et démarrer les conteneurs :
```sh
docker compose up -d
```
_Attendre que tous les conteneurs soient bien démarrés_

3 - Se rendre sur Kibana : 
```sh
http://localhost:5601
```
Et on doit atterrir sur cette page :  
<p align="center">
  <img width="640" height="316" alt="image" src="https://github.com/user-attachments/assets/c74a6e83-73e9-416c-8429-a11329153f6c" />
</p>

## 5 - Démonstration
Ici on va voir comment générer, traiter, stocker et visualiser une log Nginx, en vérifiant à chaque étapes.
Il convient de rappeler les ports de chaque conteneurs : 
- Nginx : 8080
- Logstash : 5044
- Elasticsearch : 9200
- Kibana : 5601  
1 - On se connecte sur http://localhost:8080
2 - On vérifie qu'un log HTTP est généré :
```sh
docker exec nginx_container_demo cat /var/log/nginx/access_lab.log
```
_Note : Ici on va lire les logs du fichier access_lab.log, il s'agit d'un fichier qu'on crée en plus du fichier access.log de base de nginx, car par défaut docker renvoie les informations de ces fichiers vers stdout de docker et non dans le fichier_
Résultat :  
<img width="1422" height="28" alt="image" src="https://github.com/user-attachments/assets/e0e59bb1-2690-4c3a-97cf-3d750de9568c" />
3 - On vérifie que Logstash a bien traité la log :
```sh
docker logs -f logstash_container_demo
```
Résultat :  
<img width="1697" height="454" alt="image" src="https://github.com/user-attachments/assets/dec42835-f852-43b7-a91d-db7364ef5663" />

4 - On vérifie le stockage dans Elasticsearch :
- Récupération de l'indexe :  
```sh
curl.exe "http://localhost:9200/_cat/indices?v"
```
Résultat :  
<img width="1408" height="37" alt="image" src="https://github.com/user-attachments/assets/c588b797-b25b-4ff1-9dd7-6f5d8589ea17" />
- On vérifie que la log est enregistré dans Elasticsearch avec l'indexe obtenu précédemment :
```sh
curl.exe "http://localhost:9200/nginx-access-lab/_search?pretty"
``` 
Résultat :  
<img width="1680" height="476" alt="image" src="https://github.com/user-attachments/assets/444da6ea-de45-4626-8bc1-0fe8a8fdbe5e" />
5 - Se rendre sur Kibana :
```sh
http://localhost:5601
```
Aller dans le menu à gauche > Stack Management > Data View > Create Data View > Rentrer les informations "Nom de la vue de données", "Nom indexe" : 
<img width="1438" height="393" alt="image" src="https://github.com/user-attachments/assets/b05a7aea-8f0f-40cf-908e-8e2627da092f" />
Revenir au Menu à gauche > Analytics > Dashboards > Create a new dashboard > Create Lens > Mettre @timestamp dans l'axe X, Et mettre http.response.status_code dans l'axe Y et dans la répartition : 
<img width="1919" height="865" alt="image" src="https://github.com/user-attachments/assets/309be031-01b0-437a-8cc5-c00f44139572" />
Cliquer sur Enregistrer et on a un Dashboard qui nous permet d'afficher la répartition des codes HTTP :
<img width="1919" height="897" alt="image" src="https://github.com/user-attachments/assets/553226cf-1f4d-4fb9-b349-fdd10afdbbb9" />



