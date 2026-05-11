package com.lepos.lepos.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.LoginState
import com.lepos.lepos.domain.usecase.LoginUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class LoginViewModel(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(LoginState())
    val state: StateFlow<LoginState> = _state.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val result = loginUseCase.execute(email, password)

            when (result) {
                is DomainResult.Success -> {
                    _state.update { it.copy(isLoading = false, isLoggedIn = true) }
                }

                is DomainResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun resetState() {
        _state.update { LoginState() }
    }
}
