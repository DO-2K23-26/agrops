#!/bin/bash



echo "Redeploying player services with fixed HTTPRoute resources..."
helm upgrade --install doriano ./player-istio/ -f ./player-istio/values/values-doriano.yaml  -n player-demo --create-namespace
helm upgrade --install theos ./player-istio/ -f ./player-istio/values/values-theos.yaml -n player-demo --create-namespace
helm upgrade --install mathios ./player-istio/ -f ./player-istio/values/values-mathios.yaml -n player-demo --create-namespace
helm upgrade --install benbenos ./player-istio/ -f ./player-istio/values/values-benbenos.yaml -n player-demo --create-namespace
helm upgrade --install tristiano ./player-istio/ -f ./player-istio/values/values-tristiano.yaml -n player-demo --create-namespace

echo "Applying Istio Gateway..."
kubectl apply -f ./player-istio/scripts/istio-gateway.yaml


echo "Verifying HTTPRoute resources..."
kubectl get httproute -A

echo "Verifying Gateway status..."
kubectl get gateway -A

echo "Done!"


