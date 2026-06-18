pipeline {
    agent any

    stages {
        stage('Verify Tools')
        {
            steps{
                bat 'git --version'
                bat 'docker --version'
            }
        }

        stage('Build Backend Image')
        {
            steps{
                dir('backend')
                {
                    bat 'docker build -t ammu-backend:jenkins .'
                }
            }
        }

        stage('Build Frontend Image')
        {
            steps{
                dir('frontend')
                {
                    bat 'docker build -t ammu-frontend:jenkins .'
                }
            }
        }

        // stage('Verify Git') {
        //     steps {
        //         bat 'git --version'
        //     }
        // }

        // stage('Verify Docker') {
        //     steps {
        //         bat 'docker --version'
        //     }
        }

    }
}