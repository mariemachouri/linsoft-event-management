#!/bin/bash
# =====================================================================
#  Script de déploiement des Tekton Pipelines
#  Usage : bash openshift/deploy-tekton.sh
# =====================================================================

NAMESPACE="intern-machoury"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     Déploiement des Tekton Pipelines                 ║"
echo "║     Namespace : $NAMESPACE                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Vérifier que l'opérateur OpenShift Pipelines est installé
echo "→ Vérification de l'opérateur Tekton..."
if ! oc get crd pipelines.tekton.dev &>/dev/null; then
  echo "✗ ERREUR : L'opérateur OpenShift Pipelines n'est pas installé."
  echo "  Installez-le depuis : OperatorHub → OpenShift Pipelines"
  exit 1
fi
echo "✓ Opérateur Tekton détecté"

# Vérifier que le ClusterTask openshift-client existe
echo "→ Vérification du ClusterTask openshift-client..."
if ! oc get clustertask openshift-client &>/dev/null; then
  echo "✗ ERREUR : ClusterTask 'openshift-client' introuvable."
  echo "  Assurez-vous que OpenShift Pipelines est correctement installé."
  exit 1
fi
echo "✓ ClusterTask openshift-client disponible"

echo ""
echo "→ Application des ressources Tekton..."
oc apply -f openshift/tekton-pipeline.yaml -n $NAMESPACE

echo ""
echo "→ Vérification des pipelines créés..."
oc get pipeline -n $NAMESPACE

echo ""
echo "→ Vérification du ServiceAccount..."
oc get serviceaccount pipeline-sa -n $NAMESPACE

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Pipelines déployés avec succès !                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "► Pour lancer le pipeline FRONTENDS manuellement :"
echo "  oc create -f openshift/tekton-pipelinerun-frontends.yaml -n $NAMESPACE"
echo ""
echo "► Pour lancer le pipeline SERVICES manuellement :"
echo "  oc create -f openshift/tekton-pipelinerun-services.yaml -n $NAMESPACE"
echo ""
echo "► Pour suivre les logs en temps réel :"
echo "  tkn pipelinerun logs -f -n $NAMESPACE --last"
echo ""
echo "► URL du webhook (après déploiement de l'EventListener) :"
oc get route event-management-webhook -n $NAMESPACE -o jsonpath='https://{.spec.host}' 2>/dev/null || echo "  (route en cours de création)"
echo ""
