# Configure Kubernetes Cluster with Ansible
This folder contains Ansible playbook to configure a Kubernetes cluster (k3s) on Debian 12 VM.

## Prerequisites
- Ansible installed on your local machine.
- SSH access to 4 Debian 12 VMs (1 master and 3 workers).
- Sudo command available on each VM for the user you are using to connect via SSH.
- The VMs should be reachable via SSH using IP addresses specified in the inventory file.

## Inventory File
The inventory file `hosts` contains the list of target hosts. You can modify it to include your own hosts.

## Playbooks
The playbook `playbook.yaml` is used to install and configure the Kubernetes cluster. 
```bash
ansible-playbook playbook.yaml -i hosts --ask-become-pass
```

## Kubernetes Cluster Access
To access the Kubernetes cluster, you need to copy the `kubeconfig` file from the master node to your local machine. You can do this using `scp` or any other file transfer method.

```bash
ssh user@master-node
su -
cp /etc/rancher/k3s/k3s.yaml /home/user/k3s.yaml
exit

scp user@master-node:/home/user/k3s.yaml ~/.kube/config-vm
```
Make sure to replace `user` and `master-node` with the appropriate username and hostname or IP address of your master node.

Export the `KUBECONFIG` environment variable to point to the copied `kubeconfig` file:
```bash
export KUBECONFIG=~/.kube/config-vm
```

Verify the connection to the Kubernetes cluster:
```bash
kubectl get nodes
```