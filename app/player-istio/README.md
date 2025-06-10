# player-istio

Ce chart Helm déploie un service de joueur (`player-service`) dans un environnement Kubernetes avec Istio pour démontrer les capacités d'un service mesh.

## Prérequis

- Kubernetes 1.29+
- Helm 3.0+
- Istio 1.22+
- cert-manager (pour la gestion des certificats TLS)

## Installation

### 1. Installation d'Istio

Avant d'installer ce chart, vous devez avoir Istio installé sur votre cluster. Si ce n'est pas déjà fait, vous pouvez l'installer comme suit :

```bash
# Télécharger Istio
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.22.0 sh -

# Naviguer vers le dossier Istio téléchargé
cd istio-1.22.0

# Ajouter istioctl à votre PATH
export PATH=$PWD/bin:$PATH

# Installer Istio avec le profil demo (inclut Kiali, Jaeger, Prometheus, Grafana)
istioctl install --set profile=demo -y

# Vérifier l'installation
kubectl get pods -n istio-system
```

### 2. Installation de cert-manager

Si vous souhaitez activer TLS, vous devez installer cert-manager :

```bash
# Installer cert-manager avec ses CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Attendre que tous les pods soient prêts
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=90s

# Créer un ClusterIssuer auto-signé
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned
spec:
  selfSigned: {}
EOF
```

### 3. Activation de l'injection automatique de sidecar

Activez l'injection automatique du sidecar Istio dans le namespace où vous allez déployer le service :

```bash
# Créer un namespace pour le déploiement (si nécessaire)
kubectl create namespace player-demo

# Activer l'injection automatique du sidecar Istio
kubectl label namespace player-demo istio-injection=enabled
```

### 4. Déploiement du chart Helm

Maintenant, vous pouvez déployer le chart Helm :

```bash
# Déployer le joueur A
helm install joueur-a ./player-istio \
  --set playerName=joueur-a \
  --set istio.host=joueur-a.local.mesh \
  --namespace player-demo

# Déployer le joueur B
helm install joueur-b ./player-istio \
  --set playerName=joueur-b \
  --set istio.host=joueur-b.local.mesh \
  --namespace player-demo
```

## Vérification du déploiement

### 1. Vérifier les ressources déployées

```bash
# Vérifier les pods
kubectl get pods -n player-demo

# Vérifier les services
kubectl get services -n player-demo

# Vérifier les ressources Istio
kubectl get virtualservices,destinationrules,gateways,httproutes -n player-demo
```

### 2. Tester le service

Vous pouvez tester le service en utilisant port-forward :

```bash
# Port-forward vers le service joueur-a
kubectl port-forward svc/joueur-a 8080:8080 -n player-demo
```

Dans un autre terminal :

```bash
# Tester le ping
curl http://localhost:8080/ping

# Tester le challenge (contre joueur-b)
curl -X POST http://localhost:8080/challenge \
  -H "Content-Type: application/json" \
  -d '{"opponentUrl": "http://joueur-b:8080/ping"}'
```

Ou si vous avez configuré DNS pour accéder à la gateway :

```bash
# Ajouter une entrée dans /etc/hosts pour joueur-a.local.mesh et joueur-b.local.mesh
echo "$(kubectl get svc -n istio-system istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}') joueur-a.local.mesh joueur-b.local.mesh" | sudo tee -a /etc/hosts

# Tester les services via la gateway
curl http://joueur-a.local.mesh/ping
curl http://joueur-b.local.mesh/ping
```

### 3. Observer le trafic avec Kiali

Kiali vous permet de visualiser le trafic entre vos services :

```bash
# Accéder à Kiali
istioctl dashboard kiali
```

Vous pouvez également accéder à Jaeger pour le tracing :

```bash
# Accéder à Jaeger
istioctl dashboard jaeger
```

## Configuration

Le chart offre les options de configuration suivantes dans `values.yaml` :

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `playerName` | Nom du joueur | `joueur-a` |
| `image.repository` | Dépôt de l'image | `myregistry/player-service` |
| `image.tag` | Tag de l'image | `latest` |
| `image.pullPolicy` | Politique de pull de l'image | `IfNotPresent` |
| `service.port` | Port du service | `8080` |
| `istio.host` | Nom d'hôte pour le service | `joueur-a.local.mesh` |
| `istio.gatewayName` | Nom de la gateway Istio | `player-gateway` |
| `istio.gatewayNamespace` | Namespace de la gateway Istio | `istio-system` |
| `istio.enableFaultInjection` | Active l'injection de fautes | `true` |
| `istio.faultDelayMs` | Délai injecté en millisecondes | `1500` |
| `istio.faultPercentage` | Pourcentage de requêtes avec délai | `50` |
| `istio.enableCircuitBreaker` | Active le circuit breaker | `true` |
| `tls.enabled` | Active TLS | `true` |
| `tls.issuer` | Nom du ClusterIssuer | `selfsigned` |

## Finalités pédagogiques

Ce chart démontre plusieurs fonctionnalités clés d'Istio :

1. **mTLS strict** - Toutes les communications entre services sont sécurisées avec mTLS
2. **Observabilité** - Les headers de tracing sont propagés pour permettre une visualisation dans Kiali et Jaeger
3. **Fault Injection** - Des délais peuvent être injectés pour tester la résilience
4. **Circuit Breaking** - Protection contre les défaillances en cascade
5. **Contrôle du trafic HTTP** - Utilisation de la Gateway API pour le routage




## Deploy


```
helm upgrade --install tristiano ./player-istio -n player-demo --create-namespace
helm upgrade --install doriano ./player-istio -n player-demo --create-namespace -f player-istio/values/values-doriano.yaml
helm upgrade --install mathios ./player-istio -n player-demo --create-namespace -f player-istio/values/values-mathios.yaml
helm upgrade --install benbenos ./player-istio -n player-demo --create-namespace -f player-istio/values/values-benbenos.yaml
helm upgrade --install theos ./player-istio -n player-demo --create-namespace -f player-istio/values/values-theos.yaml
```