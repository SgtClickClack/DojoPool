// Generated type definitions

// Type imports

document.addEventListener('DOMContentLoaded', function () {
  // Initialize date/time pickers
  const dateInputs: any = document.querySelectorAll(
    'input[type="datetime-local"]'
  );
  dateInputs.forEach((input) => {
    // Set min date to today
    const today: any = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    input.min = today.toISOString().slice(0, 16);
  });

  // Tournament creation form validation
  const createTournamentForm: any = document.getElementById(
    'createTournamentForm'
  );
  if (createTournamentForm) {
    createTournamentForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const startDate: any = new Date(
        document.getElementById('startDate').value
      );
      const endDate: any = new Date(document.getElementById('endDate').value);
      const registrationDeadline: any = new Date(
        document.getElementById('registrationDeadline').value
      );

      if (registrationDeadline >= startDate) {
        alert('Registration deadline must be before the tournament start date');
        return;
      }

      if (endDate <= startDate) {
        alert('End date must be after the start date');
        return;
      }

      this.submit();
    });
  }

  // Match result form handling
  const matchResultModal: any = document.getElementById('matchResultModal');
  if (matchResultModal) {
    matchResultModal.addEventListener('show.bs.modal', function (event) {
      const button: any = event.relatedTarget;
      const matchId: any = button.getAttribute('data-match-id');
      const player1Name: any = button.getAttribute('data-player1-name');
      const player2Name: any = button.getAttribute('data-player2-name');
      const player1Avatar: any = button.getAttribute('data-player1-avatar');
      const player2Avatar: any = button.getAttribute('data-player2-avatar');

      // Update form action URL
      const form: any = this.querySelector('#matchResultForm');
      const actionUrl: any = form.action.replace(
        /match_id=\d*/,
        `match_id=${matchId}`
      );
      form.action = actionUrl;

      // Update player information
      this.querySelector('.player1-name').textContent = player1Name;
      this.querySelector('.player2-name').textContent = player2Name;
      this.querySelector('.player1-info img').src = player1Avatar;
      this.querySelector('.player2-info img').src = player2Avatar;

      // Reset form
      form.reset();
    });

    const matchResultForm: any = document.getElementById('matchResultForm');
    matchResultForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const player1Score: any = parseInt(
        document.getElementById('player1Score').value
      );
      const player2Score: any = parseInt(
        document.getElementById('player2Score').value
      );
      const isFinal: any = document.getElementById('finalResult').checked;

      if (isFinal && player1Score === player2Score) {
        alert('Final scores cannot be tied');
        return;
      }

      this.submit();
    });
  }

  // Tournament registration handling
  const registerForms: any = document.querySelectorAll(
    'form[action*="register"]'
  );
  registerForms.forEach((form) => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (confirm('Are you sure you want to register for this tournament?')) {
        this.submit();
      }
    });
  });

  // Tournament format explanation tooltips
  const formatSelect: any = document.getElementById('tournamentFormat');
  if (formatSelect) {
    const formatDescriptions: any = {
      single_elimination:
        'Players are eliminated after one loss. The tournament proceeds until there is one undefeated player.',
      double_elimination:
        'Players must lose twice to be eliminated. Features a winners and losers bracket.',
      round_robin:
        'Every player plays against every other player once. Winner determined by most matches won.',
      swiss:
        'Players are paired with others who have similar records. Good for large tournaments.',
    };

    const tooltip: any = new bootstrap.Tooltip(formatSelect, {
      title: () => formatDescriptions[formatSelect.value],
      placement: 'right',
      trigger: 'hover',
    });

    formatSelect.addEventListener('change', () => {
      tooltip._config.title = formatDescriptions[formatSelect.value];
    });
  }

  // Dynamic entry fee calculation
  const entryFeeInput: any = document.getElementById('entryFee');
  const maxParticipantsInput: any = document.getElementById('maxParticipants');
  const prizePooInput: any = document.getElementById('prizePool');

  if (entryFeeInput && maxParticipantsInput && prizePooInput) {
    const calculatePrizePool: any = () => {
      const entryFee: any = parseFloat(entryFeeInput.value) || 0;
      const maxParticipants: any = parseInt(maxParticipantsInput.value) || 0;
      const suggestedPrizePool: any = entryFee * maxParticipants;
      prizePooInput.value = suggestedPrizePool.toFixed(2);
    };

    entryFeeInput.addEventListener('input', calculatePrizePool);
    maxParticipantsInput.addEventListener('input', calculatePrizePool);
  }
});
