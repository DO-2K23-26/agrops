#!/bin/bash



echo "Redeploying player services with fixed HTTPRoute resources..."
helm upgrade --install doriano ./player-istio/ --set playerName=doriano  -n player-demo --create-namespace
helm upgrade --install theos ./player-istio/ --set playerName=theos -n player-demo --create-namespace
helm upgrade --install mathios ./player-istio/ --set playerName=mathios -n player-demo --create-namespace
helm upgrade --install benbenos ./player-istio/ --set playerName=benbenos -n player-demo --create-namespace
helm upgrade --install tristiano ./player-istio/ --set playerName=tristiano -n player-demo --create-namespace

echo "Applying Istio Gateway..."
kubectl apply -f ./player-istio/scripts/istio-gateway.yaml


echo "Verifying HTTPRoute resources..."
kubectl get httproute -A

echo "Verifying Gateway status..."
kubectl get gateway -A

echo "Done!"


