<!-- LoginForm.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import axios from 'axios';
	import isLoggedIn from '../../lib/stores/auth';
	import { theme } from '$lib/stores/night';

	let formLogin: HTMLFormElement;
	let submitButton: HTMLButtonElement;
	let inputUsername: HTMLInputElement;
	let inputPassword: HTMLInputElement;
	let inputApiToken: HTMLInputElement;
	let loginStatusMessage: HTMLElement;
	let storedApiToken: string | null = '';

	function displayLoginError(message: string | null) {
		loginStatusMessage.textContent = message;
		loginStatusMessage.classList.add('error');
		loginStatusMessage.style.display = 'block';
	}

	function resetSubmitButton() {
		submitButton.disabled = false;
		submitButton.textContent = 'Submit';
	}

	async function handleLogin(event: Event) {
		event.preventDefault();
		const username = inputUsername.value.trim();
		const password = inputPassword.value.trim();
		const apiToken = inputApiToken.value.trim();

		if (!username) {
			displayLoginError('Please enter a username.');
			return;
		}

		submitButton.disabled = true;
		submitButton.textContent = 'Loading...';

		try {
			const response = await axios.post(
				'/login',
				{ username, password, apiToken },
				{ withCredentials: true }
			);
			let loginResult;
			if (response) loginResult = response.data;
			if (loginResult.authenticated) {
				$isLoggedIn = true;
				if (apiToken) {
					localStorage.setItem('huggingfaceApiToken', apiToken);
				}
			}
		} catch (error: any) {
			if (error.response && error.response.status === 401) {
				displayLoginError(error.response.data.error || 'Invalid credentials');
			} else {
				displayLoginError('An unexpected error occurred');
			}
			resetSubmitButton();
		}
	}

	onMount(() => {
		storedApiToken = localStorage.getItem('huggingfaceApiToken');
		if (storedApiToken && inputApiToken) {
			inputApiToken.value = storedApiToken;
		}
		formLogin.addEventListener('submit', handleLogin);
	});
</script>

<div class="container" class:dark={$theme === 'dark'}>
	<h1>Login to NewsBlur</h1>
	<form class="login-form" bind:this={formLogin}>
		<div class="form-group">
			<label for="inputUsername" class="form-label dark-label">Username</label>
			<input
				type="text"
				class="form-control"
				bind:this={inputUsername}
				placeholder="Enter username"
				autocomplete="on"
			/>
		</div>
		<div class="form-group">
			<label for="inputPassword" class="form-label dark-label">Password</label>
			<input
				type="password"
				class="form-control"
				bind:this={inputPassword}
				placeholder="Password"
				autocomplete="on"
			/>
		</div>
		<div class="form-group">
			<label for="inputApiToken" class="form-label dark-label"
				>Hugging Face API Token (Optional)</label
			>
			<input
				type="text"
				class="form-control"
				bind:this={inputApiToken}
				placeholder="Enter your Hugging Face API token"
				autocomplete="on"
			/>
			<small class="form-text text-muted">
				Get your token from <a href="https://huggingface.co/settings/tokens" target="_blank"
					>Hugging Face</a
				>
			</small>
		</div>
		<div class="form-group">
			<div class="action-group">
				<button type="submit" class="btn btn-primary" bind:this={submitButton}>Submit</button>
				<div
					id="loginStatusMessage"
					class="status-message dark-error"
					bind:this={loginStatusMessage}
				></div>
			</div>
		</div>
	</form>
</div>

<style>
	.dark h1 {
		color: white;
	}

	.dark .dark-label {
		color: #ccc; /* Lighter color for dark mode */
	}

	.dark .dark-error {
		color: #ff6b6b; /* Lighter red for dark mode */
	}

	.status-message {
		margin-left: 15px; /* Add a small margin to the left */
		margin-bottom: 10px; /* Remove any top margin */
		/* Other styles remain unchanged */
	}
	.action-group {
		display: flex;
		justify-content: left;
		align-items: center; /* Vertically align the button and the message */
	}
	.container {
		max-width: 600px;
		margin: auto;
		padding: 20px;
	}

	.form-group label,
	.form-group .form-control,
	.status-message {
		grid-column: 2 / 3; /* Place input and status message in the second column */
	}

	.status-message {
		margin-top: 10px; /* Add space between button and status message */
	}

	.btn {
		padding: 10px 15px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn:hover {
		background-color: #0056b3;
	}

	.status-message {
		grid-column: 2 / 3; /* Span the status message across the second column */
		color: red;
		text-align: left;
	}
</style>
