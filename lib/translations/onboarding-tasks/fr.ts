import { OnboardingTask } from '../../onboarding-tasks';

export const tasks: OnboardingTask[] = [
  {
    Name: 'Tâche 1 : Créer une nouvelle réservation',
    Description:
      '### Ce qu\'il faut faire\nCréez une réservation pour un client arrivant la semaine prochaine pour un **séjour de 3 nuits**. Choisissez un type d\'espace, sélectionnez un tarif et finalisez la réservation.\n\n### Comment procéder\n1. Accédez au **Timeline** et cliquez sur un espace disponible\n2. Renseignez les informations du client, les dates et le tarif\n3. Confirmez la réservation\n\n\ud83d\udcd6 [Article d\'aide : Créer une réservation](https://help.mews.com/s/article/create-a-reservation)',
  },
  {
    Name: 'Tâche 2 : Enregistrer l\'arrivée d\'une réservation',
    Description:
      '### Ce qu\'il faut faire\nRetrouvez la réservation créée dans la Tâche 1 et **enregistrez l\'arrivée du client**. Attribuez une chambre et confirmez que le check-in est terminé.\n\n### Comment procéder\n1. Ouvrez la réservation depuis le **Timeline** ou l\'**Aperçu des réservations**\n2. Cliquez sur **Check in**\n3. Vérifiez l\'attribution de la chambre et confirmez\n\n\ud83d\udcd6 [Article d\'aide : Enregistrer l\'arrivée d\'une réservation](https://help.mews.com/s/article/check-in-a-reservation)',
  },
  {
    Name: 'Tâche 3 : Enregistrer le départ d\'une réservation',
    Description:
      '### Ce qu\'il faut faire\nLocalisez une réservation dont le client est arrivé, vérifiez sa facture et **effectuez le check-out**.\n\n### Comment procéder\n1. Ouvrez la réservation du client enregistré\n2. Accédez à l\'onglet **Billing** et vérifiez tous les frais\n3. Clôturez la facture et cliquez sur **Check out**\n\n\ud83d\udcd6 [Article d\'aide : Enregistrer le départ d\'une réservation](https://help.mews.com/s/article/how-to-check-out-a-reservation)',
  },
  {
    Name: 'Tâche 4 : Annuler une réservation',
    Description:
      '### Ce qu\'il faut faire\nOuvrez une réservation future et **annulez-la**. Sélectionnez un motif d\'annulation et vérifiez les frais d\'annulation appliqués.\n\n### Comment procéder\n1. Ouvrez une réservation confirmée\n2. Cliquez sur le menu **plus d\'actions** et sélectionnez **Annuler**\n3. Choisissez un motif d\'annulation et confirmez\n\n\ud83d\udcd6 [Article d\'aide : Annuler une réservation](https://help.mews.com/s/article/cancel-a-reservation)',
  },
  {
    Name: 'Tâche 5 : Ajouter un produit à une réservation',
    Description:
      '### Ce qu\'il faut faire\nOuvrez une réservation existante et **ajoutez un produit** (par ex. petit-déjeuner, parking ou minibar) à la réservation.\n\n### Comment procéder\n1. Ouvrez une réservation et accédez à l\'onglet **Products**\n2. Sélectionnez un produit à ajouter\n3. Vérifiez qu\'il apparaît dans l\'onglet **Billing**\n\n\ud83d\udcd6 [Article d\'aide : Ajouter des produits à une réservation](https://help.mews.com/s/article/How-to-link-additional-products-to-a-reservation-in-Mews-Operations)',
  },
  {
    Name: 'Tâche 6 : Corriger une facture clôturée',
    Description:
      '### Ce qu\'il faut faire\nRecherchez une facture clôturée et utilisez le **processus d\'avoir** pour la corriger. Cela simule une correction de facturation courante après le départ.\n\n### Comment procéder\n1. Accédez au profil du client ou à la réservation\n2. Localisez la **facture clôturée**\n3. Suivez le processus d\'avoir pour émettre une correction\n\n\ud83d\udcd6 [Article d\'aide : Corriger une facture clôturée](https://help.mews.com/s/article/new-billing-procedure-correct-a-closed-bill)',
  },
  {
    Name: 'Tâche 7 : Changer le titulaire de la réservation',
    Description:
      '### Ce qu\'il faut faire\nOuvrez une réservation et **réattribuez le titulaire** à un autre profil client.\n\n### Comment procéder\n1. Ouvrez une réservation avec un accompagnant ou créez-en une\n2. Cliquez sur le **nom du titulaire** pour le modifier\n3. Recherchez et sélectionnez un autre client comme nouveau titulaire\n\n\ud83d\udcd6 [Article d\'aide : Changer le titulaire de la réservation](https://help.mews.com/s/article/How-to-change-the-guest-on-a-reservation)',
  },
  {
    Name: 'Tâche 8 : Consulter un profil client',
    Description:
      '### Ce qu\'il faut faire\nRecherchez un client par nom et **consultez son profil**, y compris ses réservations passées et les informations client.\n\n### Comment procéder\n1. Utilisez la **barre de recherche** pour trouver un client par nom ou e-mail\n2. Ouvrez son **profil client**\n3. Explorez les onglets : réservations, historique de facturation et informations client\n\n\ud83d\udcd6 [Article d\'aide : Informations client](https://help.mews.com/s/article/How-to-identify-returning-guests-using-guest-insights-in-Mews-Operations)',
  },
];
