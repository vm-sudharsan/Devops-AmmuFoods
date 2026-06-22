pipeline {
agent any

environment {
    DOCKERHUB_USERNAME = "sudharsanprakalathanvm"
    BACKEND_IMAGE = "sudharsanprakalathanvm/ammufoods-backend"
    FRONTEND_IMAGE = "sudharsanprakalathanvm/ammufoods-frontend"
}

stages {

    stage('Verify Kubernetes') {
        steps {
            bat 'kubectl version --client'
            bat 'kubectl get nodes'
        }
    }

    stage('Verify Tools') {
        steps {
            bat 'git --version'
            bat 'docker --version'
        }
    }

    stage('Build Metadata') {
        steps {
            script {
                env.GIT_COMMIT_SHORT = powershell(
                    script: '(git rev-parse --short HEAD).Trim()',
                    returnStdout: true
                ).trim()
            }
            echo "Build Number : ${env.BUILD_NUMBER}"
            echo "Git Commit   : ${env.GIT_COMMIT_SHORT}"
        }
    }

    stage('Build Backend Image') {
        steps {
            dir('backend') {
                bat 'docker build -t ammu-backend:latest .'
            }
        }
    }

    stage('Build Frontend Image') {
        steps {
            dir('frontend') {
                bat '''
                docker build ^
                --build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api ^
                -t ammu-frontend:latest .
                '''
            }
        }
    }

    stage('Tag Images') {
        steps {
            bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:latest'

            bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:latest'
        }
    }

    stage('Docker Hub Login') {
        steps {
            withCredentials([
                usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )
            ]) {
                writeFile file: 'docker_token.txt', text: env.DOCKER_PASS

                bat '''
                    type docker_token.txt | docker login -u %DOCKER_USER% --password-stdin
                '''

                bat 'del docker_token.txt'
            }
        }
    }

    stage('Push Backend Image') {
        steps {
            bat 'docker push %BACKEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker push %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker push %BACKEND_IMAGE%:latest'
        }
    }

    stage('Push Frontend Image') {
        steps {
            bat 'docker push %FRONTEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker push %FRONTEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker push %FRONTEND_IMAGE%:latest'
        }
    }

    stage('Deploy To Kubernetes') {
    steps {

        bat '''
        kubectl set image deployment/ammufoods-backend ^
        backend=%BACKEND_IMAGE%:%BUILD_NUMBER%
        '''

        bat '''
        kubectl set image deployment/ammufoods-frontend ^
        frontend=%FRONTEND_IMAGE%:%BUILD_NUMBER%
        '''

        bat 'kubectl rollout status deployment/ammufoods-backend'
        bat 'kubectl rollout status deployment/ammufoods-frontend'
    }
}

    stage('Verify Deployment') {
    steps {

        bat 'kubectl get pods'

        bat '''
        kubectl rollout status deployment/ammufoods-backend
        '''

        bat '''
        kubectl rollout status deployment/ammufoods-frontend
        '''
    }
}
}

}
