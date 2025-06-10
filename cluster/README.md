## Setup Gateway API

To setup the kube Gateway API, you can use the following command to apply the [standard installation manifest](https://gateway-api.sigs.k8s.io/guides/):
```sh
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.3.0/standard-install.yaml
```

[Install istio](https://istio.io/latest/docs/tasks/traffic-management/ingress/gateway-api/) using minimal profile to avoid installing the ingress gateway:
```sh
istioctl install --set profile=minimal -y
```

[Install kiali](https://istio.io/latest/docs/ops/integrations/kiali/):
```sh
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.26/samples/addons/kiali.yaml
```

[Install grafana](https://istio.io/latest/docs/ops/integrations/grafana/):
```sh
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.26/samples/addons/grafana.yaml
```

[Install prometheus](https://istio.io/latest/docs/ops/integrations/prometheus/):
```sh
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.26/samples/addons/prometheus.yaml
```

[Install jeager](https://istio.io/latest/docs/ops/integrations/jaeger/):
```sh
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.26/samples/addons/jaeger.yaml
```