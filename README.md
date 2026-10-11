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
```bash
git clone https://github.com/MattRodriguez64/elk_stack_mre.git
```
2 - Utiliser docker compose dans le fichier pour construire et démarrer les conteneurs :
```bash
docker compose up -d
```
_Attendre que tous les conteneurs soient bien démarrés_

3 - Se rendre sur Kibana : 
```bash
http://localhost:5601
```
Et on doit atterrir sur cette page :  
<p align="center">
  <img width="640" height="316" alt="image" src="https://github.com/user-attachments/assets/c74a6e83-73e9-416c-8429-a11329153f6c" />
</p>

