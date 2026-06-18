pipeline {
    agent any

    stages {

        stage('Verify Git') {
            steps {
                bat 'git --version'
            }
        }

        stage('Verify Docker') {
            steps {
                bat 'docker --version'
            }
        }

    }
}